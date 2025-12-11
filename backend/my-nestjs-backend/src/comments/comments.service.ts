// src/comments/comments.service.ts
import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException 
} from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DRIZZLE } from '../db/database.module';
import { comments, tasks, projectMembers, Comment } from '../db/schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import * as schema from '../db/schema';

@Injectable()
export class CommentsService {
  constructor(
    @Inject(DRIZZLE) private db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createCommentDto: CreateCommentDto, userId: number): Promise<Comment> {
    // Get task to check project
    const taskResult = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, createCommentDto.taskId));

    if (taskResult.length === 0) {
      throw new NotFoundException('Task không tồn tại');
    }

    const task = taskResult[0];

    // Check if user has access to project (even viewer can comment)
    const hasAccess = await this.checkUserInProject(userId, task.projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền comment trên task này');
    }

    // Validate parent comment if provided
    if (createCommentDto.parentCommentId) {
      const parentResult = await this.db
        .select()
        .from(comments)
        .where(eq(comments.id, createCommentDto.parentCommentId));

      if (parentResult.length === 0) {
        throw new NotFoundException('Parent comment không tồn tại');
      }

      const parentComment = parentResult[0];

      if (parentComment.taskId !== createCommentDto.taskId) {
        throw new ForbiddenException('Parent comment không thuộc task này');
      }
    }

    const result = await this.db
      .insert(comments)
      .values({
        taskId: createCommentDto.taskId,
        userId,
        content: createCommentDto.content,
        parentCommentId: createCommentDto.parentCommentId,
      })
      .returning();

    return result[0];
  }

  async findByTask(taskId: number, userId: number): Promise<Comment[]> {
    // Get task to check project
    const taskResult = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (taskResult.length === 0) {
      throw new NotFoundException('Task không tồn tại');
    }

    const task = taskResult[0];

    // Check access
    const hasAccess = await this.checkUserInProject(userId, task.projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền xem comments của task này');
    }

    // Get all top-level comments (no parent)
    return await this.db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.taskId, taskId),
          isNull(comments.parentCommentId)
        )
      );
  }

  async findReplies(commentId: number, userId: number): Promise<Comment[]> {
    // Get parent comment
    const parentResult = await this.db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId));

    if (parentResult.length === 0) {
      throw new NotFoundException('Comment không tồn tại');
    }

    const parentComment = parentResult[0];

    // Get task to check access
    const taskResult = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, parentComment.taskId));

    const task = taskResult[0];

    const hasAccess = await this.checkUserInProject(userId, task.projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền xem replies');
    }

    return await this.db
      .select()
      .from(comments)
      .where(eq(comments.parentCommentId, commentId));
  }

  async findOne(id: number, userId: number): Promise<Comment> {
    const result = await this.db
      .select()
      .from(comments)
      .where(eq(comments.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Comment với ID ${id} không tồn tại`);
    }

    const comment = result[0];

    // Get task to check access
    const taskResult = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, comment.taskId));

    const task = taskResult[0];

    const hasAccess = await this.checkUserInProject(userId, task.projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền xem comment này');
    }

    return comment;
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, userId: number): Promise<Comment> {
    const comment = await this.findOne(id, userId);

    // Only comment owner can update
    if (comment.userId !== userId) {
      throw new ForbiddenException('Bạn chỉ có thể chỉnh sửa comment của mình');
    }

    const result = await this.db
      .update(comments)
      .set({ 
        content: updateCommentDto.content,
        updatedAt: new Date() 
      })
      .where(eq(comments.id, id))
      .returning();

    return result[0];
  }

  async remove(id: number, userId: number): Promise<void> {
    const comment = await this.findOne(id, userId);

    // Get task to check if user is admin
    const taskResult = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, comment.taskId));

    const task = taskResult[0];

    const isAdmin = await this.checkPermission(task.projectId, userId, ['admin']);
    const isOwner = comment.userId === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Bạn không có quyền xóa comment này');
    }

    await this.db.delete(comments).where(eq(comments.id, id));
  }

  // Helper
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