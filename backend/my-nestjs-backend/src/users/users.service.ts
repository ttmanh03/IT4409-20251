// src/users/users.service.ts
import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, or, ilike } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '../db/database.module';
import { users, User } from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as schema from '../db/schema';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    // Check if email already exists
    const existingEmail = await this.findByEmail(createUserDto.email);
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Check if username already exists
    const existingUsername = await this.findByUsername(createUserDto.username);
    if (existingUsername) {
      throw new ConflictException('Username đã được sử dụng');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const [user] = await this.db
      .insert(users)
      .values({
        email: createUserDto.email,
        username: createUserDto.username,
        passwordHash,
        fullName: createUserDto.fullName,
        avatarUrl: createUserDto.avatarUrl,
        status: createUserDto.status || 'active',
      })
      .returning();

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const allUsers = await this.db.select().from(users);
    return allUsers.map(({ passwordHash, ...user }) => user);
  }

  async findOne(id: number): Promise<Omit<User, 'passwordHash'>> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      throw new NotFoundException(`User với ID ${id} không tồn tại`);
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return user;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));

    return user;
  }

  async findByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, emailOrUsername),
          eq(users.username, emailOrUsername)
        )
      );

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'passwordHash'>> {
    // Check if user exists
    await this.findOne(id);

    const updateData: any = { ...updateUserDto, updatedAt: new Date() };

    // Hash password if provided
    if (updateUserDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      delete updateData.password;
    }

    // Check email uniqueness if changing email
    if (updateUserDto.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    // Check username uniqueness if changing username
    if (updateUserDto.username) {
      const existingUser = await this.findByUsername(updateUserDto.username);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Username đã được sử dụng');
      }
    }

    const [user] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async remove(id: number): Promise<void> {
    const result = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`User với ID ${id} không tồn tại`);
    }
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  async validateUser(loginDto: LoginUserDto): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.findByEmailOrUsername(loginDto.emailOrUsername);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    if (user.status !== 'active') {
      throw new ConflictException('Tài khoản đã bị khóa hoặc vô hiệu hóa');
    }

    // Update last login
    await this.updateLastLogin(user.id);

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}