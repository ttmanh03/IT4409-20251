import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum, Matches } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]{2,10}$/, {
    message: 'Project key phải là 2-10 ký tự viết hoa (A-Z, 0-9)'
  })
  key: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['planning', 'active', 'on_hold', 'completed', 'archived'])
  @IsOptional()
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

  @IsEnum(['private', 'team', 'public'])
  @IsOptional()
  visibility?: 'private' | 'team' | 'public';

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}