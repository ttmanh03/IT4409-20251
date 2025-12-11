// src/projects/projects.service.ts
import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DRIZZLE } from '../db/database.module';
import { projects, projectMembers, Project } from '../db/schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import * as schema from '../db/schema';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(DRIZZLE) private db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createProjectDto: CreateProjectDto, ownerId: number): Promise<Project> {
    // Create project
    const [project] = await this.db
      .insert(projects)
      .values({
        ...createProjectDto,
        ownerId,
      })
      .returning();

    // Automatically add owner as admin member
    await this.db
      .insert(projectMembers)
      .values({
        projectId: project.id,
        userId: ownerId,
        role: 'admin',
        status: 'active',
        invitedBy: null,
        joinedAt: new Date(),
      });

    return project;
  }

  async findAll(): Promise<Project[]> {
    return await this.db.select().from(projects);
  }

  async findByUser(userId: number): Promise<Project[]> {
    // Get all projects where user is a member
    const userProjects = await this.db
      .select({
        project: projects,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.status, 'active')
        )
      );

    return userProjects.map(up => up.project);
  }

  async findOne(id: number): Promise<Project> {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) {
      throw new NotFoundException(`Project với ID ${id} không tồn tại`);
    }

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto, userId: number): Promise<Project> {
    // Check if project exists
    const project = await this.findOne(id);

    // Check if user has permission (must be admin or owner)
    const canUpdate = await this.checkUserPermission(id, userId, ['admin']);
    if (!canUpdate && project.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật project này');
    }

    const [updatedProject] = await this.db
      .update(projects)
      .set({ ...updateProjectDto, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    return updatedProject;
  }

  async remove(id: number, userId: number): Promise<void> {
    const project = await this.findOne(id);

    // Only owner can delete project
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Chỉ owner mới có thể xóa project');
    }

    await this.db.delete(projects).where(eq(projects.id, id));
  }

  // Helper: Check if user has specific role in project
  async checkUserPermission(
    projectId: number,
    userId: number,
    allowedRoles: string[],
  ): Promise<boolean> {
    const [member] = await this.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
          eq(projectMembers.status, 'active')
        )
      );

    if (!member) {
      return false;
    }

    return allowedRoles.includes(member.role);
  }

  // Helper: Get user's role in project
  async getUserRole(projectId: number, userId: number): Promise<string | null> {
    const [member] = await this.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
          eq(projectMembers.status, 'active')
        )
      );

    return member ? member.role : null;
  }
}