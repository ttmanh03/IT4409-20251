// src/labels/labels.module.ts
import { Module } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelsController, TaskLabelsController } from './labels.controller';

@Module({
  controllers: [LabelsController, TaskLabelsController],
  providers: [LabelsService],
  exports: [LabelsService],
})
export class LabelsModule {}