// src/attachments/attachments.service.ts
import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException 
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DRIZZLE } from '../db/database.module';
import { attachments, tasks, projectMembers, Attachment } from '../db/schema';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import * as schema from '../db/schema';

@Injectable()
export class AttachmentsService {
  constructor(
    @Inject(DRIZZLE) private db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createAttachmentDto: CreateAttachmentDto, userId: number): Promise<Attachment> {
    // Get task to check project
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, createAttachmentDto.taskId));

    if (!task) {
      throw new NotFoundException('Task không tồn tại');
    }

    // Check if user has access (at least member)
    const canUpload = await this.checkPermission(task.projectId, userId, ['member', 'admin']);
    if (!canUpload) {
      throw new ForbiddenException('Bạn không có quyền upload file vào task này');
    }

    const [attachment] = await this.db
      .insert(attachments)
      .values({
        ...createAttachmentDto,
        uploadedBy: userId,
      })
      .returning();

    return attachment;
  }

  async findByTask(taskId: number, userId: number): Promise<Attachment[]> {
    // Get task to check project
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
      throw new ForbiddenException('Bạn không có quyền xem attachments của task này');
    }

    return await this.db
      .select()
      .from(attachments)
      .where(eq(attachments.taskId, taskId));
  }

  async findOne(id: number, userId: number): Promise<Attachment> {
    const [attachment] = await this.db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id));

    if (!attachment) {
      throw new NotFoundException(`Attachment với ID ${id} không tồn tại`);
    }

    // Get task to check access
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, attachment.taskId));

    const hasAccess = await this.checkUserInProject(userId, task.projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền xem attachment này');
    }

    return attachment;
  }

  async remove(id: number, userId: number): Promise<void> {
    const attachment = await this.findOne(id, userId);

    // Get task to check permissions
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, attachment.taskId));

    const isAdmin = await this.checkPermission(task.projectId, userId, ['admin']);
    const isUploader = attachment.uploadedBy === userId;

    if (!isAdmin && !isUploader) {
      throw new ForbiddenException('Bạn không có quyền xóa attachment này');
    }

    // TODO: Delete actual file from storage (S3, etc.)
    // await this.deleteFileFromStorage(attachment.fileUrl);

    await this.db.delete(attachments).where(eq(attachments.id, id));
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