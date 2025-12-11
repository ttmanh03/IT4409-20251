import {
  IsString,
  IsNotEmpty,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

// Custom validator cho email hoặc username
@ValidatorConstraint({ name: 'isEmailOrUsername', async: false })
export class IsEmailOrUsernameConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (!value) return false;

    // Check if it's a valid email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(value)) {
      return true;
    }

    // Check if it's a valid username format
    const usernamePattern = /^[a-zA-Z0-9_-]{5,20}$/;
    if (usernamePattern.test(value)) {
      return true;
    }

    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return `Email hoặc Username không hợp lệ. Email: user@example.com, Username: 5-20 ký tự (a-z, A-Z, 0-9, _, -)`;
  }
}

export function IsEmailOrUsername(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailOrUsernameConstraint,
    });
  };
}

export class LoginUserDto {
  @IsString({ message: 'Email/Username phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Email/Username là bắt buộc' })
  @IsEmailOrUsername({
    message: 'Email hoặc Username không hợp lệ. Email: user@example.com, Username: 5-20 ký tự (a-z, A-Z, 0-9, _, -)'
  })
  emailOrUsername: string;

  @IsString({ message: 'Password phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Password là bắt buộc' })
  password: string;
}