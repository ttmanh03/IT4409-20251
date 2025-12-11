// src/users/users.service.ts
import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, or, ilike } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { DRIZZLE } from '../db/database.module';
import { users, User } from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailService } from '../email/email.service';
import * as schema from '../db/schema';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private db: NeonHttpDatabase<typeof schema>,
    private emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    // Validation
    if (!createUserDto.email || !createUserDto.email.includes('@')) {
      throw new BadRequestException('Email không hợp lệ');
    }

    if (createUserDto.username.length < 5 || createUserDto.username.length > 20) {
      throw new BadRequestException('Username phải từ 5-20 ký tự');
    }

    // Check if email already exists
    const existingEmail = await this.findByEmail(createUserDto.email);
    if (existingEmail) {
      throw new ConflictException('Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập');
    }

    // Check if username already exists
    const existingUsername = await this.findByUsername(createUserDto.username);
    if (existingUsername) {
      throw new ConflictException('Username này đã tồn tại. Vui lòng chọn username khác');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() +  60 * 1000); // 1 minute

    const [user] = await this.db
      .insert(users)
      .values({
        email: createUserDto.email,
        username: createUserDto.username,
        passwordHash,
        fullName: createUserDto.fullName,
        avatarUrl: createUserDto.avatarUrl,
        status: createUserDto.status || 'active',
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
        emailVerified: false,
      })
      .returning();

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.fullName || 'User',
        verificationToken,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Vẫn tạo tài khoản nhưng log lỗi
    }

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
      throw new BadRequestException('Email/Username hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new BadRequestException('Email/Username hoặc mật khẩu không đúng');
    }

    if (user.status !== 'active') {
      throw new ConflictException('Tài khoản đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ quản trị viên');
    }

    // Update last login
    await this.updateLastLogin(user.id);

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<Omit<User, 'passwordHash'>> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.verificationToken, verifyEmailDto.token));

    if (!user) {
      throw new BadRequestException('Token xác thực không hợp lệ');
    }

    // Check if token has expired
    if (!user.verificationTokenExpiry || new Date() > user.verificationTokenExpiry) {
      throw new BadRequestException('Token xác thực đã hết hạn. Vui lòng đăng ký lại');
    }

    // Check if email already verified
    if (user.emailVerified) {
      throw new BadRequestException('Email đã được xác thực');
    }

    // Update user: mark as verified, clear token
    const [updatedUser] = await this.db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException('Email không tồn tại');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email này đã được xác thực');
    }

    // Generate new token
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 1000); // 1 phút

    // Update token in DB
    await this.db
      .update(users)
      .set({
        verificationToken,
        verificationTokenExpiry: tokenExpiry,
      })
      .where(eq(users.id, user.id));

    // Send email
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.fullName || 'User',
        verificationToken,
      );
      return { message: 'Email xác thực đã được gửi lại' };
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      throw new Error('Không thể gửi email xác thực');
    }
  }
}