import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsUrl, Matches } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'Username chỉ chấp nhận a-z, 0-9, _, -'
  })
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsEnum(['active', 'inactive', 'suspended'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'suspended';
}