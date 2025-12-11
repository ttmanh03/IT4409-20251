// src/comments/comments.controller.ts
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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCommentDto: CreateCommentDto) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.commentsService.create(createCommentDto, userId);
  }

  @Get()
  findByTask(@Query('taskId', ParseIntPipe) taskId: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.commentsService.findByTask(taskId, userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.commentsService.findOne(id, userId);
  }

  @Get(':id/replies')
  findReplies(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.commentsService.findReplies(id, userId);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.commentsService.update(id, updateCommentDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.commentsService.remove(id, userId);
  }
}