// src/tasks/tasks.service.ts
import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DRIZZLE } from '../db/database.module';
import { tasks, projectMembers, sprints, Task } from '../db/schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import * as schema from '../db/schema';

@Injectable()
export class TasksService {
  constructor(
    @Inject(DRIZZLE) private db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createTaskDto: CreateTaskDto, reporterId: number): Promise<Task> {
    // Check if user has permission in project (at least member)
    const canCreate = await this.checkPermission(
      createTaskDto.projectId, 
      reporterId, 
      ['member', 'admin']
    );
    
    if (!canCreate) {
      throw new ForbiddenException('Bạn không có quyền tạo task trong project này');
    }

    // Validate assignee if provided
    if (createTaskDto.assigneeId) {
      const assigneeInProject = await this.checkUserInProject(
        createTaskDto.assigneeId,
        createTaskDto.projectId
      );
      
      if (!assigneeInProject) {
        throw new BadRequestException('Assignee không phải member của project');
      }
    }

    // Validate sprint if provided
    if (createTaskDto.sprintId) {
      const sprintResults = await this.db
        .select()
        .from(sprints)
        .where(
          and(
            eq(sprints.id, createTaskDto.sprintId),
            eq(sprints.projectId, createTaskDto.projectId)
          )
        );

      if (sprintResults.length === 0) {
        throw new BadRequestException('Sprint không thuộc project này');
      }
    }

    // Validate parent task if provided
    if (createTaskDto.parentTaskId) {
      const parentResults = await this.db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.id, createTaskDto.parentTaskId),
            eq(tasks.projectId, createTaskDto.projectId)
          )
        );

      if (parentResults.length === 0) {
        throw new BadRequestException('Parent task không thuộc project này');
      }
    }

    // Generate task number (auto increment per project)
    const taskNumber = await this.generateTaskNumber(createTaskDto.projectId);

    // Create task
    const result = await this.db
      .insert(tasks)
      .values({
        ...createTaskDto,
        taskNumber,
        reporterId,
      })
      .returning();

    return result[0];
  }

  async findAll(): Promise<Task[]> {
    return await this.db.select().from(tasks);
  }

  async findByProject(projectId: number, userId: number): Promise<Task[]> {
    // Check if user has access to project
    const hasAccess = await this.checkUserInProject(userId, projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền xem tasks của project này');
    }

    return await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt));
  }

  async findBySprint(sprintId: number, userId: number): Promise<Task[]> {
    // Get sprint to check project
    const sprintResults = await this.db
      .select()
      .from(sprints)
      .where(eq(sprints.id, sprintId));

    if (sprintResults.length === 0) {
      throw new NotFoundException('Sprint không tồn tại');
    }

    const sprint = sprintResults[0];

    // Check access
    const hasAccess = await this.checkUserInProject(userId, sprint.projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền xem sprint này');
    }

    return await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.sprintId, sprintId))
      .orderBy(desc(tasks.createdAt));
  }

  async findByAssignee(assigneeId: number, userId: number): Promise<Task[]> {
    // User can only view their own tasks or if they're admin
    if (assigneeId !== userId) {
      throw new ForbiddenException('Bạn chỉ có thể xem tasks được assign cho mình');
    }

    return await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.assigneeId, assigneeId))
      .orderBy(desc(tasks.createdAt));
  }

  async findOne(id: number, userId: number): Promise<Task> {
    const result = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Task với ID ${id} không tồn tại`);
    }

    const task = result[0];

    // Check if user has access to this task's project
    const hasAccess = await this.checkUserInProject(userId, task.projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền xem task này');
    }

    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId: number): Promise<Task> {
    const task = await this.findOne(id, userId);

    // Check permission (member or admin can update)
    const canUpdate = await this.checkPermission(task.projectId, userId, ['member', 'admin']);
    if (!canUpdate) {
      throw new ForbiddenException('Bạn không có quyền cập nhật task này');
    }

    // Validate assignee if changing
    if (updateTaskDto.assigneeId !== undefined && updateTaskDto.assigneeId !== null) {
      const assigneeInProject = await this.checkUserInProject(
        updateTaskDto.assigneeId,
        task.projectId
      );
      
      if (!assigneeInProject) {
        throw new BadRequestException('Assignee không phải member của project');
      }
    }

    // Validate sprint if changing
    if (updateTaskDto.sprintId !== undefined && updateTaskDto.sprintId !== null) {
      const sprintResults = await this.db
        .select()
        .from(sprints)
        .where(
          and(
            eq(sprints.id, updateTaskDto.sprintId),
            eq(sprints.projectId, task.projectId)
          )
        );

      if (sprintResults.length === 0) {
        throw new BadRequestException('Sprint không thuộc project này');
      }
    }

    const result = await this.db
      .update(tasks)
      .set({ ...updateTaskDto, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    return result[0];
  }

  async remove(id: number, userId: number): Promise<void> {
    const task = await this.findOne(id, userId);

    // Only admin or reporter can delete
    const isAdmin = await this.checkPermission(task.projectId, userId, ['admin']);
    const isReporter = task.reporterId === userId;

    if (!isAdmin && !isReporter) {
      throw new ForbiddenException('Chỉ admin hoặc người tạo task mới có thể xóa');
    }

    await this.db.delete(tasks).where(eq(tasks.id, id));
  }

  async updateStatus(
    id: number, 
    status: string, 
    userId: number
  ): Promise<Task> {
    const task = await this.findOne(id, userId);

    // Member or admin can update status
    const canUpdate = await this.checkPermission(task.projectId, userId, ['member', 'admin']);
    if (!canUpdate) {
      throw new ForbiddenException('Bạn không có quyền cập nhật status');
    }

    const result = await this.db
      .update(tasks)
      .set({ 
        status: status as any,
        updatedAt: new Date() 
      })
      .where(eq(tasks.id, id))
      .returning();

    return result[0];
  }

  async assignTask(
    id: number, 
    assigneeId: number, 
    userId: number
  ): Promise<Task> {
    const task = await this.findOne(id, userId);

    // Check permission
    const canAssign = await this.checkPermission(task.projectId, userId, ['member', 'admin']);
    if (!canAssign) {
      throw new ForbiddenException('Bạn không có quyền assign task');
    }

    // Validate assignee
    const assigneeInProject = await this.checkUserInProject(assigneeId, task.projectId);
    if (!assigneeInProject) {
      throw new BadRequestException('Assignee không phải member của project');
    }

    const result = await this.db
      .update(tasks)
      .set({ 
        assigneeId,
        updatedAt: new Date() 
      })
      .where(eq(tasks.id, id))
      .returning();

    return result[0];
  }

  async getSubtasks(parentTaskId: number, userId: number): Promise<Task[]> {
    const parentTask = await this.findOne(parentTaskId, userId);

    return await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.parentTaskId, parentTaskId))
      .orderBy(desc(tasks.createdAt));
  }

  // Helper: Generate task number
  private async generateTaskNumber(projectId: number): Promise<number> {
    const result = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.taskNumber))
      .limit(1);

    return result.length > 0 ? result[0].taskNumber + 1 : 1;
  }

  // Helper: Check if user is in project
  private async checkUserInProject(userId: number, projectId: number): Promise<boolean> {
    const result = await this.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.status, 'active')
        )
      );

    return result.length > 0;
  }

  // Helper: Check permission
  private async checkPermission(
    projectId: number, 
    userId: number, 
    allowedRoles: string[]
  ): Promise<boolean> {
    const result = await this.db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId),
          eq(projectMembers.status, 'active')
        )
      );

    if (result.length === 0) {
      return false;
    }

    return allowedRoles.includes(result[0].role);
  }
}