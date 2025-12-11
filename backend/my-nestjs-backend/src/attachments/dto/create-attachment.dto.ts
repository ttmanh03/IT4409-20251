import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateAttachmentDto {
  @IsNumber()
  @IsNotEmpty()
  taskId: number;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;
}