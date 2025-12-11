// src/attachments/attachments.controller.ts
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
  Query,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAttachmentDto: CreateAttachmentDto) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.attachmentsService.create(createAttachmentDto, userId);
  }

  @Get()
  findByTask(@Query('taskId', ParseIntPipe) taskId: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.attachmentsService.findByTask(taskId, userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.attachmentsService.findOne(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.attachmentsService.remove(id, userId);
  }
}