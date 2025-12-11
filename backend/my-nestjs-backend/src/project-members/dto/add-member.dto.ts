import { IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class AddMemberDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsEnum(['viewer', 'member', 'admin'])
  @IsOptional()
  role?: 'viewer' | 'member' | 'admin';
}