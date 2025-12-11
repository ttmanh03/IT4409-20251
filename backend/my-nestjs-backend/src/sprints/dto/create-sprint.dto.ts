import { IsNotEmpty, IsString, IsOptional, IsDateString, IsNumber, IsEnum } from 'class-validator';

export class CreateSprintDto {
  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsEnum(['planned', 'active', 'completed'])
  @IsOptional()
  status?: 'planned' | 'active' | 'completed';
}