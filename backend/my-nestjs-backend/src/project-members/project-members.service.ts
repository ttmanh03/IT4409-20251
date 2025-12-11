// src/project-members/project-members.service.ts
import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DRIZZLE } from '../db/database.module';
import { projectMembers, projects, users, ProjectMember } from '../db/schema';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import * as schema from '../db/schema';

@Injectable()
export class ProjectMembersService {
  constructor(
    @Inject(DRIZZLE) private db: NeonHttpDatabase<typeof schema>,
  ) {}

  async addMember(
    projectId: number,
    addMemberDto: AddMemberDto,
    invitedBy: number,
  ): Promise<ProjectMember> {
    // Check if project exists
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      throw new NotFoundException(`Project với ID ${projectId} không tồn tại`);
    }

    // Check if user to be added exists
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, addMemberDto.userId));

    if (!user) {
      throw new NotFoundException(`User với ID ${addMemberDto.userId} không tồn tại`);
    }

    // Check if inviter has permission (must be admin or owner)
    const [inviter] = await this.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, invitedBy),
          eq(projectMembers.status, 'active')
        )
      );

    if (!inviter || (inviter.role !== 'admin' && project.ownerId !== invitedBy)) {
      throw new ForbiddenException('Bạn không có quyền thêm member vào project này');
    }

    // Check if user is already a member
    const [existingMember] = await this.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, addMemberDto.userId)
        )
      );

    if (existingMember) {
      if (existingMember.status === 'active') {
        throw new ConflictException('User đã là member của project này');
      }
      // If previously removed, reactivate
      const [reactivated] = await this.db
        .update(projectMembers)
        .set({
          status: 'invited',
          role: addMemberDto.role || 'member',
          invitedBy,
          invitedAt: new Date(),
        })
        .where(eq(projectMembers.id, existingMember.id))
        .returning();

      return reactivated;
    }

    // Add new member
    const [member] = await this.db
      .insert(projectMembers)
      .values({
        projectId,
        userId: addMemberDto.userId,
        role: addMemberDto.role || 'member',
        status: 'invited',
        invitedBy,
      })
      .returning();

    return member;
  }

  async findAllByProject(projectId: number): Promise<ProjectMember[]> {
    return await this.db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
  }

  async findActiveMembers(projectId: number): Promise<ProjectMember[]> {
    return await this.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.status, 'active')
        )
      );
  }

  async acceptInvitation(projectId: number, userId: number): Promise<ProjectMember> {
    const [member] = await this.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
          eq(projectMembers.status, 'invited')
        )
      );

    if (!member) {
      throw new NotFoundException('Lời mời không tồn tại');
    }

    const [updated] = await this.db
      .update(projectMembers)
      .set({
        status: 'active',
        joinedAt: new Date(),
      })
      .where(eq(projectMembers.id, member.id))
      .returning();

    return updated;
  }

  async updateRole(
    projectId: number,
    userId: number,
    updateRoleDto: UpdateMemberRoleDto,
    updatedBy: number,
  ): Promise<ProjectMember> {
    // Check if updater has permission
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      throw new NotFoundException(`Project với ID ${projectId} không tồn tại`);
    }

    const [updater] = await this.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, updatedBy),
          eq(projectMembers.status, 'active')
        )
      );

    if (!updater || (updater.role !== 'admin' && project.ownerId !== updatedBy)) {
      throw new ForbiddenException('Bạn không có quyền thay đổi role');
    }

    // Cannot change owner's role
    if (userId === project.ownerId) {
      throw new ForbiddenException('Không thể thay đổi role của owner');
    }

    // Find member
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
      throw new NotFoundException('Member không tồn tại trong project');
    }

    const [updated] = await this.db
      .update(projectMembers)
      .set({ role: updateRoleDto.role })
      .where(eq(projectMembers.id, member.id))
      .returning();

    return updated;
  }

  async removeMember(
    projectId: number,
    userId: number,
    removedBy: number,
  ): Promise<void> {
    // Check if remover has permission
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      throw new NotFoundException(`Project với ID ${projectId} không tồn tại`);
    }

    const [remover] = await this.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, removedBy),
          eq(projectMembers.status, 'active')
        )
      );

    if (!remover || (remover.role !== 'admin' && project.ownerId !== removedBy)) {
      throw new ForbiddenException('Bạn không có quyền remove member');
    }

    // Cannot remove owner
    if (userId === project.ownerId) {
      throw new ForbiddenException('Không thể remove owner');
    }

    // Soft delete: set status to 'removed'
    const result = await this.db
      .update(projectMembers)
      .set({ status: 'removed' })
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Member không tồn tại trong project');
    }
  }
}