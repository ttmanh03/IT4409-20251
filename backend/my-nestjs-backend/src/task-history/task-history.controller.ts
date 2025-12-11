// src/task-history/task-history.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TaskHistoryService } from './task-history.service';

@Controller('task-history')
export class TaskHistoryController {
  constructor(private readonly taskHistoryService: TaskHistoryService) {}

  @Get()
  findByTask(@Query('taskId', ParseIntPipe) taskId: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.taskHistoryService.findByTask(taskId, userId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    // TODO: Get requesterId from JWT token
    const requesterId = 1;
    return this.taskHistoryService.findByUser(userId, requesterId);
  }
}