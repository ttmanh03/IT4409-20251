// src/sprints/sprints.service.ts
import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DRIZZLE } from '../db/database.module';
import { sprints, projectMembers, Sprint } from '../db/schema';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import * as schema from '../db/schema';

@Injectable()
export class SprintsService {
  constructor(
    @Inject(DRIZZLE) private db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createSprintDto: CreateSprintDto, userId: number): Promise<Sprint> {
    // Check if user has permission (at least member)
    const canCreate = await this.checkPermission(createSprintDto.projectId, userId, ['member', 'admin']);
    if (!canCreate) {
      throw new ForbiddenException('Bạn không có quyền tạo sprint trong project này');
    }

    // Validate dates
    if (new Date(createSprintDto.startDate) >= new Date(createSprintDto.endDate)) {
      throw new BadRequestException('Start date phải trước end date');
    }

    const [sprint] = await this.db
      .insert(sprints)
      .values(createSprintDto)
      .returning();

    return sprint;
  }

  async findAllByProject(projectId: number): Promise<Sprint[]> {
    return await this.db
      .select()
      .from(sprints)
      .where(eq(sprints.projectId, projectId));
  }

  async findOne(id: number): Promise<Sprint> {
    const [sprint] = await this.db
      .select()
      .from(sprints)
      .where(eq(sprints.id, id));

    if (!sprint) {
      throw new NotFoundException(`Sprint với ID ${id} không tồn tại`);
    }

    return sprint;
  }

  async update(id: number, updateSprintDto: UpdateSprintDto, userId: number): Promise<Sprint> {
    const sprint = await this.findOne(id);

    // Check permission
    const canUpdate = await this.checkPermission(sprint.projectId, userId, ['member', 'admin']);
    if (!canUpdate) {
      throw new ForbiddenException('Bạn không có quyền cập nhật sprint này');
    }

    // Validate dates if provided
    const startDate = updateSprintDto.startDate ? new Date(updateSprintDto.startDate) : new Date(sprint.startDate);
    const endDate = updateSprintDto.endDate ? new Date(updateSprintDto.endDate) : new Date(sprint.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date phải trước end date');
    }

    const [updated] = await this.db
      .update(sprints)
      .set({ ...updateSprintDto, updatedAt: new Date() })
      .where(eq(sprints.id, id))
      .returning();

    return updated;
  }

  async remove(id: number, userId: number): Promise<void> {
    const sprint = await this.findOne(id);

    // Check permission (only admin)
    const canDelete = await this.checkPermission(sprint.projectId, userId, ['admin']);
    if (!canDelete) {
      throw new ForbiddenException('Bạn không có quyền xóa sprint này');
    }

    await this.db.delete(sprints).where(eq(sprints.id, id));
  }

  async startSprint(id: number, userId: number): Promise<Sprint> {
    const sprint = await this.findOne(id);

    if (sprint.status !== 'planned') {
      throw new BadRequestException('Chỉ có thể start sprint đang ở trạng thái planned');
    }

    const canStart = await this.checkPermission(sprint.projectId, userId, ['member', 'admin']);
    if (!canStart) {
      throw new ForbiddenException('Bạn không có quyền start sprint');
    }

    const [updated] = await this.db
      .update(sprints)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(sprints.id, id))
      .returning();

    return updated;
  }

  async completeSprint(id: number, userId: number): Promise<Sprint> {
    const sprint = await this.findOne(id);

    if (sprint.status !== 'active') {
      throw new BadRequestException('Chỉ có thể complete sprint đang active');
    }

    const canComplete = await this.checkPermission(sprint.projectId, userId, ['member', 'admin']);
    if (!canComplete) {
      throw new ForbiddenException('Bạn không có quyền complete sprint');
    }

    const [updated] = await this.db
      .update(sprints)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(sprints.id, id))
      .returning();

    return updated;
  }

  // Helper
  private async checkPermission(projectId: number, userId: number, allowedRoles: string[]): Promise<boolean> {
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
}