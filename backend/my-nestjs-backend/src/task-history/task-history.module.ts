import { Module } from '@nestjs/common';
import { TaskHistoryService } from './task-history.service';
import { TaskHistoryController } from './task-history.controller';

@Module({
  providers: [TaskHistoryService],
  controllers: [TaskHistoryController]
})
export class TaskHistoryModule {}
