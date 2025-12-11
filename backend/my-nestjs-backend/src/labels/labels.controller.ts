// src/labels/labels.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { AssignLabelDto } from './dto/assign-label.dto';

@Controller('labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLabelDto: CreateLabelDto) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.labelsService.create(createLabelDto, userId);
  }

  @Get()
  findByProject(@Query('projectId', ParseIntPipe) projectId: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.labelsService.findByProject(projectId, userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.labelsService.findOne(id, userId);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLabelDto: UpdateLabelDto,
  ) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.labelsService.update(id, updateLabelDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.labelsService.remove(id, userId);
  }
}

@Controller('tasks/:taskId/labels')
export class TaskLabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  assignToTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() assignLabelDto: AssignLabelDto,
  ) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.labelsService.assignToTask(taskId, assignLabelDto, userId);
  }

  @Get()
  findByTask(@Param('taskId', ParseIntPipe) taskId: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.labelsService.findByTask(taskId, userId);
  }

  @Delete(':labelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFromTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('labelId', ParseIntPipe) labelId: number,
  ) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.labelsService.removeFromTask(taskId, labelId, userId);
  }
}