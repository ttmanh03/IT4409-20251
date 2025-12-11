// src/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    // TODO: Get requesterId from JWT token
    const requesterId = 1;
    return this.notificationsService.findByUser(userId, requesterId);
  }

  @Get('user/:userId/unread')
  findUnread(@Param('userId', ParseIntPipe) userId: number) {
    // TODO: Get requesterId from JWT token
    const requesterId = 1;
    return this.notificationsService.findUnread(userId, requesterId);
  }

  @Get('user/:userId/count')
  async getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.notificationsService.findOne(id, userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('user/:userId/read-all')
  async markAllAsRead(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationsService.markAllAsRead(userId);
    return {
      message: `Đã đánh dấu ${count} notifications là đã đọc`,
      count,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.notificationsService.remove(id, userId);
  }

  @Delete('user/:userId/all')
  async removeAll(@Param('userId', ParseIntPipe) userId: number) {
    const count = await this.notificationsService.removeAll(userId);
    return {
      message: `Đã xóa ${count} notifications`,
      count,
    };
  }
}