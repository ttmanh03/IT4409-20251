import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  Matches,
  MaxLength,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

// Custom validator cho password strength
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    // Ít nhất 8 ký tự
    if (password.length < 8) return false;
    
    // Ít nhất 1 chữ cái in hoa
    if (!/[A-Z]/.test(password)) return false;
    
    // Ít nhất 1 chữ cái thường
    if (!/[a-z]/.test(password)) return false;
    
    // Ít nhất 1 chữ số
    if (!/[0-9]/.test(password)) return false;
    
    // Ít nhất 1 ký tự đặc biệt
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Password phải chứa ít nhất 8 ký tự, 1 chữ in hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt`;
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ. Ví dụ: user@example.com' })
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  email: string;

  @IsString({ message: 'Username phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Username là bắt buộc' })
  @Matches(/^[a-zA-Z0-9_-]{3,50}$/, {
    message: 'Username: 3-50 ký tự, chỉ chứa a-z, A-Z, 0-9, _, -'
  })
  username: string;

  @IsString({ message: 'Password phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Password là bắt buộc' })
  @IsStrongPassword({
    message: 'Password phải: 8+ ký tự, 1 chữ in hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt'
  })
  password: string;

  @IsString({ message: 'Full Name phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Full Name là bắt buộc' })
  @MaxLength(100, { message: 'Full Name không được quá 100 ký tự' })
  fullName: string;

  @IsUrl({}, { message: 'Avatar URL không hợp lệ' })
  @IsOptional()
  avatarUrl?: string;

  @IsEnum(['active', 'inactive', 'suspended'], { message: 'Status không hợp lệ' })
  @IsOptional()
  status?: 'active' | 'inactive' | 'suspended';
}