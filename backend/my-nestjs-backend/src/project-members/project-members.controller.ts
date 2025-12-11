// src/project-members/project-members.controller.ts
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
  Patch,
} from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Controller('projects/:projectId/members')
export class ProjectMembersController {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  addMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() addMemberDto: AddMemberDto,
  ) {
    // TODO: Get userId from JWT token
    const invitedBy = 1;
    return this.projectMembersService.addMember(projectId, addMemberDto, invitedBy);
  }

  @Get()
  findAllByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectMembersService.findAllByProject(projectId);
  }

  @Get('active')
  findActiveMembers(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectMembersService.findActiveMembers(projectId);
  }

  @Patch(':userId/accept')
  acceptInvitation(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.projectMembersService.acceptInvitation(projectId, userId);
  }

  @Patch(':userId/role')
  updateRole(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateRoleDto: UpdateMemberRoleDto,
  ) {
    // TODO: Get updatedBy from JWT token
    const updatedBy = 1;
    return this.projectMembersService.updateRole(projectId, userId, updateRoleDto, updatedBy);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    // TODO: Get removedBy from JWT token
    const removedBy = 1;
    return this.projectMembersService.removeMember(projectId, userId, removedBy);
  }
}