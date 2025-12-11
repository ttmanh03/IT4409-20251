// src/sprints/sprints.controller.ts
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
  Patch,
} from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';

@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSprintDto: CreateSprintDto) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.sprintsService.create(createSprintDto, userId);
  }

  @Get()
  findAll(@Query('projectId', ParseIntPipe) projectId: number) {
    return this.sprintsService.findAllByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sprintsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSprintDto: UpdateSprintDto,
  ) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.sprintsService.update(id, updateSprintDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.sprintsService.remove(id, userId);
  }

  @Patch(':id/start')
  startSprint(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.sprintsService.startSprint(id, userId);
  }

  @Patch(':id/complete')
  completeSprint(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    const userId = 1;
    return this.sprintsService.completeSprint(id, userId);
  }
}