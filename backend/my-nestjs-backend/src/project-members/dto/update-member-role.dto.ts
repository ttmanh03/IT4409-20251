import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsEnum(['viewer', 'member', 'admin'])
  @IsNotEmpty()
  role: 'viewer' | 'member' | 'admin';
}