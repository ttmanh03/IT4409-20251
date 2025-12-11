// src/notifications/notifications.service.ts
import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DRIZZLE } from '../db/database.module';
import { notifications, Notification } from '../db/schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import * as schema from '../db/schema';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DRIZZLE) private db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const [notification] = await this.db
      .insert(notifications)
      .values(createNotificationDto)
      .returning();

    return notification;
  }

  async findByUser(userId: number, requesterId: number): Promise<Notification[]> {
    // Users can only see their own notifications
    if (userId !== requesterId) {
      throw new ForbiddenException('Bạn chỉ có thể xem notifications của mình');
    }

    return await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async findUnread(userId: number, requesterId: number): Promise<Notification[]> {
    if (userId !== requesterId) {
      throw new ForbiddenException('Bạn chỉ có thể xem notifications của mình');
    }

    return await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  async findOne(id: number, userId: number): Promise<Notification> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));

    if (!notification) {
      throw new NotFoundException(`Notification với ID ${id} không tồn tại`);
    }

    // Only owner can view
    if (notification.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem notification này');
    }

    return notification;
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.findOne(id, userId);

    const [updated] = await this.db
      .update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date() 
      })
      .where(eq(notifications.id, id))
      .returning();

    return updated;
  }

  async markAllAsRead(userId: number): Promise<number> {
    const result = await this.db
      .update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date() 
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .returning();

    return result.length;
  }

  async remove(id: number, userId: number): Promise<void> {
    const notification = await this.findOne(id, userId);

    await this.db.delete(notifications).where(eq(notifications.id, id));
  }

  async removeAll(userId: number): Promise<number> {
    const result = await this.db
      .delete(notifications)
      .where(eq(notifications.userId, userId))
      .returning();

    return result.length;
  }

  async getUnreadCount(userId: number): Promise<number> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    return result.length;
  }
}