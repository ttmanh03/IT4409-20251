// src/labels/labels.service.ts
import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException,
  ConflictException 
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DRIZZLE } from '../db/database.module';
import { labels, taskLabels, projectMembers, tasks, Label, TaskLabel } from '../db/schema';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { AssignLabelDto } from './dto/assign-label.dto';
import * as schema from '../db/schema';

@Injectable()
export class LabelsService {
  constructor(
    @Inject(DRIZZLE) private db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createLabelDto: CreateLabelDto, userId: number): Promise<Label> {
    // Check permission (at least member)
    const canCreate = await this.checkPermission(
      createLabelDto.projectId, 
      userId, 
      ['member', 'admin']
    );
    
    if (!canCreate) {
      throw new ForbiddenException('Bạn không có quyền tạo label trong project này');
    }

    // Check if label name already exists in project
    const [existing] = await this.db
      .select()
      .from(labels)
      .where(
        and(
          eq(labels.projectId, createLabelDto.projectId),
          eq(labels.name, createLabelDto.name)
        )
      );

    if (existing) {
      throw new ConflictException('Label với tên này đã tồn tại trong project');
    }

    const [label] = await this.db
      .insert(labels)
      .values(createLabelDto)
      .returning();

    return label;
  }

  async findByProject(projectId: number, userId: number): Promise<Label[]> {
    // Check access
    const hasAccess = await this.checkUserInProject(userId, projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền xem labels của project này');
    }

    return await this.db
      .select()
      .from(labels)
      .where(eq(labels.projectId, projectId));
  }

  async findOne(id: number, userId: number): Promise<Label> {
    const [label] = await this.db
      .select()
      .from(labels)
      .where(eq(labels.id, id));

    if (!label) {
      throw new NotFoundException(`Label với ID ${id} không tồn tại`);
    }

    // Check access
    const hasAccess = await this.checkUserInProject(userId, label.projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền xem label này');
    }

    return label;
  }

  async update(id: number, updateLabelDto: UpdateLabelDto, userId: number): Promise<Label> {
    const label = await this.findOne(id, userId);

    // Check permission
    const canUpdate = await this.checkPermission(label.projectId, userId, ['member', 'admin']);
    if (!canUpdate) {
      throw new ForbiddenException('Bạn không có quyền cập nhật label này');
    }

    // Check name uniqueness if changing
    if (updateLabelDto.name) {
      const [existing] = await this.db
        .select()
        .from(labels)
        .where(
          and(
            eq(labels.projectId, label.projectId),
            eq(labels.name, updateLabelDto.name)
          )
        );

      if (existing && existing.id !== id) {
        throw new ConflictException('Label với tên này đã tồn tại');
      }
    }

    const [updated] = await this.db
      .update(labels)
      .set(updateLabelDto)
      .where(eq(labels.id, id))
      .returning();

    return updated;
  }

  async remove(id: number, userId: number): Promise<void> {
    const label = await this.findOne(id, userId);

    // Only admin can delete labels
    const canDelete = await this.checkPermission(label.projectId, userId, ['admin']);
    if (!canDelete) {
      throw new ForbiddenException('Chỉ admin mới có thể xóa label');
    }

    await this.db.delete(labels).where(eq(labels.id, id));
  }

  // Assign label to task
  async assignToTask(taskId: number, assignLabelDto: AssignLabelDto, userId: number): Promise<TaskLabel> {
    // Get task
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!task) {
      throw new NotFoundException('Task không tồn tại');
    }

    // Check permission
    const canAssign = await this.checkPermission(task.projectId, userId, ['member', 'admin']);
    if (!canAssign) {
      throw new ForbiddenException('Bạn không có quyền assign label');
    }

    // Verify label belongs to same project
    const [label] = await this.db
      .select()
      .from(labels)
      .where(eq(labels.id, assignLabelDto.labelId));

    if (!label) {
      throw new NotFoundException('Label không tồn tại');
    }

    if (label.projectId !== task.projectId) {
      throw new ForbiddenException('Label không thuộc project của task');
    }

    // Check if already assigned
    const [existing] = await this.db
      .select()
      .from(taskLabels)
      .where(
        and(
          eq(taskLabels.taskId, taskId),
          eq(taskLabels.labelId, assignLabelDto.labelId)
        )
      );

    if (existing) {
      throw new ConflictException('Label đã được assign cho task này');
    }

    const [taskLabel] = await this.db
      .insert(taskLabels)
      .values({
        taskId,
        labelId: assignLabelDto.labelId,
      })
      .returning();

    return taskLabel;
  }

  // Remove label from task
  async removeFromTask(taskId: number, labelId: number, userId: number): Promise<void> {
    // Get task
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!task) {
      throw new NotFoundException('Task không tồn tại');
    }

    // Check permission
    const canRemove = await this.checkPermission(task.projectId, userId, ['member', 'admin']);
    if (!canRemove) {
      throw new ForbiddenException('Bạn không có quyền remove label');
    }

    const result = await this.db
      .delete(taskLabels)
      .where(
        and(
          eq(taskLabels.taskId, taskId),
          eq(taskLabels.labelId, labelId)
        )
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Label không được assign cho task này');
    }
  }

  // Get all labels of a task
  async findByTask(taskId: number, userId: number): Promise<Label[]> {
    // Get task
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!task) {
      throw new NotFoundException('Task không tồn tại');
    }

    // Check access
    const hasAccess = await this.checkUserInProject(userId, task.projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền xem labels của task này');
    }

    const taskLabelRecords = await this.db
      .select({
        label: labels,
      })
      .from(taskLabels)
      .innerJoin(labels, eq(taskLabels.labelId, labels.id))
      .where(eq(taskLabels.taskId, taskId));

    return taskLabelRecords.map(record => record.label);
  }

  // Helper
  private async checkUserInProject(userId: number, projectId: number): Promise<boolean> {
    const [member] = await this.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.status, 'active')
        )
      );

    return !!member;
  }

  private async checkPermission(
    projectId: number, 
    userId: number, 
    allowedRoles: string[]
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
}