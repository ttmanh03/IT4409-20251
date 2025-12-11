import { Module } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { ProjectMembersController } from './project-members.controller';

@Module({
  providers: [ProjectMembersService],
  controllers: [ProjectMembersController]
})
export class ProjectMembersModule {}
