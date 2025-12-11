import { IsNotEmpty, IsString, IsNumber, IsOptional, Matches } from 'class-validator';

export class CreateLabelDto {
  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color phải là hex code (VD: #FF5733)'
  })
  color: string;

  @IsString()
  @IsOptional()
  description?: string;
}