// src/task-history/task-history.service.ts
import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException 
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DRIZZLE } from '../db/database.module';
import { taskHistory, tasks, projectMembers, TaskHistory } from '../db/schema';
import * as schema from '../db/schema';

@Injectable()
export class TaskHistoryService {
  constructor(
    @Inject(DRIZZLE) private db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(
    taskId: number,
    userId: number,
    changeType: string,
    fieldName?: string,
    oldValue?: string,
    newValue?: string,
  ): Promise<TaskHistory> {
    const [history] = await this.db
      .insert(taskHistory)
      .values({
        taskId,
        userId,
        changeType: changeType as any,
        fieldName,
        oldValue,
        newValue,
      })
      .returning();

    return history;
  }

  async findByTask(taskId: number, userId: number): Promise<TaskHistory[]> {
    // Get task to check access
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
      throw new ForbiddenException('Bạn không có quyền xem history của task này');
    }

    return await this.db
      .select()
      .from(taskHistory)
      .where(eq(taskHistory.taskId, taskId))
      .orderBy(desc(taskHistory.createdAt));
  }

  async findByUser(userId: number, requesterId: number): Promise<TaskHistory[]> {
    // Users can only see their own history unless they're viewing within a project context
    if (userId !== requesterId) {
      throw new ForbiddenException('Bạn chỉ có thể xem history của mình');
    }

    return await this.db
      .select()
      .from(taskHistory)
      .where(eq(taskHistory.userId, userId))
      .orderBy(desc(taskHistory.createdAt))
      .limit(100); // Limit to recent 100 records
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
}