================================================================================
      HƯỚNG DẪN TRIỂN KHAI REGISTER/LOGIN HOÀN CHỈNH
                BTNHOM PROJECT - December 2025
================================================================================

## PHÂN TÍCH HIỆN TẠI

### Backend Status:
✓ Có kiểm tra email duy nhất
✓ Có kiểm tra username duy nhất
✓ Có hash password với bcrypt
✓ Có basic validation (email format, username pattern)
✓ Chưa: Password validation (độ dài < 8 ký tự, chưa check ký tự đặc biệt)
✓ Chưa: JWT authentication
✓ Chưa: Error handling rõ ràng
⚠️ Login/Register endpoint không có proper error responses

### Frontend Status:
✓ Có UI form đẹp
⚠️ Chỉ console.log, chưa gọi API thực
⚠️ Không validate dữ liệu phía client
⚠️ Không hiển thị lỗi cho user
⚠️ Chưa lưu token/user session

================================================================================
## BƯỚC 1: NÂNG CẤP BACKEND - TĂNG CƯỜNG VALIDATION
================================================================================

### 1.1 Cập nhật CreateUserDto với validation mạnh hơn

File: src/users/dto/create-user.dto.ts

THAY THẾ:
```typescript
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
```

BẰNG:
```typescript
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
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
    message: 'Username: 3-50 ký tự, chỉ chứa a-z, 0-9, _, -'
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
```

### 1.2 Cập nhật LoginUserDto

File: src/users/dto/login-user.dto.ts

THAY THẾ:
```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginUserDto {
  @IsString()
  @IsNotEmpty()
  emailOrUsername: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

BẰNG:
```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginUserDto {
  @IsString({ message: 'Email/Username phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Email/Username là bắt buộc' })
  emailOrUsername: string;

  @IsString({ message: 'Password phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Password là bắt buộc' })
  password: string;
}
```

### 1.3 Nâng cấp UsersService - Tăng validation

File: src/users/users.service.ts

THÊM vào đầu file, sau imports:

```typescript
import { BadRequestException } from '@nestjs/common';
```

THAY THẾ hàm `create()`:
```typescript
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    // Validation
    if (!createUserDto.email || !createUserDto.email.includes('@')) {
      throw new BadRequestException('Email không hợp lệ');
    }

    if (createUserDto.username.length < 3 || createUserDto.username.length > 50) {
      throw new BadRequestException('Username phải từ 3-50 ký tự');
    }

    // Check if email already exists
    const existingEmail = await this.findByEmail(createUserDto.email);
    if (existingEmail) {
      throw new ConflictException('Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập');
    }

    // Check if username already exists
    const existingUsername = await this.findByUsername(createUserDto.username);
    if (existingUsername) {
      throw new ConflictException('Username này đã tồn tại. Vui lòng chọn username khác');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const [user] = await this.db
      .insert(users)
      .values({
        email: createUserDto.email,
        username: createUserDto.username,
        passwordHash,
        fullName: createUserDto.fullName,
        avatarUrl: createUserDto.avatarUrl,
        status: createUserDto.status || 'active',
      })
      .returning();

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
```

THAY THẾ hàm `validateUser()`:
```typescript
  async validateUser(loginDto: LoginUserDto): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.findByEmailOrUsername(loginDto.emailOrUsername);

    if (!user) {
      throw new BadRequestException('Email/Username hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new BadRequestException('Email/Username hoặc mật khẩu không đúng');
    }

    if (user.status !== 'active') {
      throw new ConflictException('Tài khoản đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ quản trị viên');
    }

    // Update last login
    await this.updateLastLogin(user.id);

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
```

### 1.4 Cập nhật UsersController - Error handling tốt hơn

File: src/users/users.controller.ts

THAY THẾ toàn bộ:
```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);
      return {
        statusCode: 201,
        message: 'Đăng ký thành công. Vui lòng đăng nhập',
        user,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginUserDto) {
    try {
      const user = await this.usersService.validateUser(loginDto);
      if (!user) {
        return {
          statusCode: 401,
          message: 'Email/Username hoặc mật khẩu không đúng',
        };
      }
      return {
        statusCode: 200,
        message: 'Đăng nhập thành công',
        user,
        // TODO: Thêm JWT token ở đây: token: jwt.sign(...)
      };
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
```

### 1.5 Tạo Global Exception Filter

File: src/common/filters/http-exception.filter.ts (TẠO MỚI)

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'Internal server error';
    if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      message = (exceptionResponse as any).message;
      // Nếu message là array, lấy message đầu tiên
      if (Array.isArray(message)) {
        message = message[0];
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      error: exception.name,
    });
  }
}
```

### 1.6 Integrate Exception Filter vào AppModule

File: src/app.module.ts - THÊM vào imports:

```typescript
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    // ... các imports hiện tại ...
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### 1.7 Tạo thư mục common nếu chưa có

```
src/common/
  filters/
    http-exception.filter.ts
```

================================================================================
## BƯỚC 2: TRIỂN KHAI FRONTEND - CLIENT-SIDE VALIDATION & API INTEGRATION
================================================================================

### 2.1 Tạo file validation utilities

File: frontend/vite-project/src/utils/validation.ts (TẠO MỚI)

```typescript
// Validation rules for register/login

export const ValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email không hợp lệ. Ví dụ: user@example.com',
  },
  username: {
    pattern: /^[a-zA-Z0-9_-]{3,50}$/,
    message: 'Username: 3-50 ký tự, chỉ chứa a-z, A-Z, 0-9, _, -',
    minLength: 3,
    maxLength: 50,
  },
  password: {
    minLength: 8,
    requireUpperCase: true,
    requireLowerCase: true,
    requireNumber: true,
    requireSpecialChar: true,
    message: 'Password phải: 8+ ký tự, 1 chữ in hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt',
  },
  fullName: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s'-]+$/,
    message: 'Full Name không hợp lệ',
  },
};

// Validation functions
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) return { valid: false, error: 'Email là bắt buộc' };
  if (!ValidationRules.email.pattern.test(email)) {
    return { valid: false, error: ValidationRules.email.message };
  }
  return { valid: true };
};

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username) return { valid: false, error: 'Username là bắt buộc' };
  if (username.length < ValidationRules.username.minLength) {
    return { valid: false, error: `Username ít nhất ${ValidationRules.username.minLength} ký tự` };
  }
  if (username.length > ValidationRules.username.maxLength) {
    return { valid: false, error: `Username tối đa ${ValidationRules.username.maxLength} ký tự` };
  }
  if (!ValidationRules.username.pattern.test(username)) {
    return { valid: false, error: ValidationRules.username.message };
  }
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) return { valid: false, error: 'Password là bắt buộc' };
  
  if (password.length < ValidationRules.password.minLength) {
    return { valid: false, error: `Password ít nhất ${ValidationRules.password.minLength} ký tự` };
  }
  
  if (ValidationRules.password.requireUpperCase && !/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password phải có ít nhất 1 chữ in hoa' };
  }
  
  if (ValidationRules.password.requireLowerCase && !/[a-z]/.test(password)) {
    return { valid: false, error: 'Password phải có ít nhất 1 chữ thường' };
  }
  
  if (ValidationRules.password.requireNumber && !/[0-9]/.test(password)) {
    return { valid: false, error: 'Password phải có ít nhất 1 chữ số' };
  }
  
  if (ValidationRules.password.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)' };
  }
  
  return { valid: true };
};

export const validateFullName = (fullName: string): { valid: boolean; error?: string } => {
  if (!fullName) return { valid: false, error: 'Full Name là bắt buộc' };
  if (fullName.length < ValidationRules.fullName.minLength) {
    return { valid: false, error: `Full Name ít nhất ${ValidationRules.fullName.minLength} ký tự` };
  }
  if (fullName.length > ValidationRules.fullName.maxLength) {
    return { valid: false, error: `Full Name tối đa ${ValidationRules.fullName.maxLength} ký tự` };
  }
  return { valid: true };
};

export const validatePasswordConfirm = (password: string, confirmPassword: string): { valid: boolean; error?: string } => {
  if (!confirmPassword) return { valid: false, error: 'Confirm Password là bắt buộc' };
  if (password !== confirmPassword) {
    return { valid: false, error: 'Mật khẩu xác nhận không khớp' };
  }
  return { valid: true };
};
```

### 2.2 Tạo API service

File: frontend/vite-project/src/services/authService.ts (TẠO MỚI)

```typescript
const API_BASE_URL = 'http://localhost:3000';

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  user?: User;
  token?: string;
}

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Đăng ký thất bại');
    }

    return response.json();
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Đăng nhập thất bại');
    }

    const result = await response.json();
    
    // Lưu user vào localStorage
    if (result.user) {
      localStorage.setItem('user', JSON.stringify(result.user));
      // TODO: Lưu token nếu có
      // if (result.token) localStorage.setItem('token', result.token);
    }

    return result;
  },

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  getCurrentUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },
};
```

### 2.3 Cập nhật LoginPage Component

File: frontend/vite-project/src/components/LoginPage.tsx

THAY THẾ toàn bộ:

```typescript
import React, { useState } from 'react';
import { Facebook, MessageCircle, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateFullName,
  validatePasswordConfirm,
} from '../utils/validation';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  passwordConfirm?: string;
  fullName?: string;
  general?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');

  // Real-time validation handlers
  const handleUsernameChange = (value: string, isRegister: boolean) => {
    if (isRegister) {
      setRegisterUsername(value);
    } else {
      setLoginUsername(value);
    }
    
    if (errors.username) {
      const validation = validateUsername(value);
      setErrors(prev => ({
        ...prev,
        username: validation.valid ? undefined : validation.error,
      }));
    }
  };

  const handleEmailChange = (value: string) => {
    setRegisterEmail(value);
    if (errors.email) {
      const validation = validateEmail(value);
      setErrors(prev => ({
        ...prev,
        email: validation.valid ? undefined : validation.error,
      }));
    }
  };

  const handlePasswordChange = (value: string) => {
    if (isLogin) {
      setLoginPassword(value);
    } else {
      setRegisterPassword(value);
    }
    if (errors.password) {
      const validation = validatePassword(value);
      setErrors(prev => ({
        ...prev,
        password: validation.valid ? undefined : validation.error,
      }));
    }
  };

  const handleFullNameChange = (value: string) => {
    setRegisterFullName(value);
    if (errors.fullName) {
      const validation = validateFullName(value);
      setErrors(prev => ({
        ...prev,
        fullName: validation.valid ? undefined : validation.error,
      }));
    }
  };

  const handlePasswordConfirmChange = (value: string) => {
    setRegisterPasswordConfirm(value);
    if (errors.passwordConfirm) {
      const validation = validatePasswordConfirm(registerPassword, value);
      setErrors(prev => ({
        ...prev,
        passwordConfirm: validation.valid ? undefined : validation.error,
      }));
    }
  };

  // Validate form
  const validateLoginForm = (): boolean => {
    const newErrors: FormErrors = {};

    const usernameValidation = validateUsername(loginUsername);
    if (!usernameValidation.valid) {
      newErrors.username = usernameValidation.error;
    }

    const passwordValidation = validatePassword(loginPassword);
    if (!passwordValidation.valid) {
      newErrors.password = 'Password là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = (): boolean => {
    const newErrors: FormErrors = {};

    const emailValidation = validateEmail(registerEmail);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error;
    }

    const usernameValidation = validateUsername(registerUsername);
    if (!usernameValidation.valid) {
      newErrors.username = usernameValidation.error;
    }

    const passwordValidation = validatePassword(registerPassword);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error;
    }

    const passwordConfirmValidation = validatePasswordConfirm(registerPassword, registerPasswordConfirm);
    if (!passwordConfirmValidation.valid) {
      newErrors.passwordConfirm = passwordConfirmValidation.error;
    }

    const fullNameValidation = validateFullName(registerFullName);
    if (!fullNameValidation.valid) {
      newErrors.fullName = fullNameValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrors({});

    if (!validateLoginForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({
        emailOrUsername: loginUsername,
        password: loginPassword,
      });

      if (response.user) {
        setSuccessMessage('Đăng nhập thành công!');
        setTimeout(() => {
          onLogin(response.user);
        }, 1000);
      }
    } catch (error: any) {
      setErrors({
        general: error.message || 'Đăng nhập thất bại',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrors({});

    if (!validateRegisterForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        email: registerEmail,
        username: registerUsername,
        password: registerPassword,
        fullName: registerFullName,
      });

      setSuccessMessage(response.message || 'Đăng ký thành công! Chuyển sang đăng nhập...');
      setTimeout(() => {
        setIsLogin(true);
        setLoginUsername('');
        setLoginPassword('');
        setRegisterEmail('');
        setRegisterUsername('');
        setRegisterPassword('');
        setRegisterPasswordConfirm('');
        setRegisterFullName('');
      }, 1500);
    } catch (error: any) {
      setErrors({
        general: error.message || 'Đăng ký thất bại',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo và Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-500 mb-2">Jira</h1>
          <p className="text-purple-400 text-lg">
            {isLogin ? 'Đăng nhập để tiếp tục' : 'Đăng ký tài khoản'}
          </p>
        </div>

        {/* Error Message */}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{errors.general}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-700 text-sm">{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
          {/* Username/Email */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              {isLogin ? 'Email/Username' : 'Username'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={isLogin ? loginUsername : registerUsername}
                onChange={(e) => handleUsernameChange(e.target.value, !isLogin)}
                onBlur={() => {
                  const validation = validateUsername(isLogin ? loginUsername : registerUsername);
                  if (!validation.valid) {
                    setErrors(prev => ({
                      ...prev,
                      username: validation.error,
                    }));
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                  errors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder={isLogin ? 'Email hoặc Username' : 'Username (a-z, 0-9, -, _)'}
                disabled={loading}
              />
              {errors.username && (
                <AlertCircle className="absolute right-3 top-3 w-5 h-5 text-red-500" />
              )}
            </div>
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email (chỉ Register) */}
          {!isLogin && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => {
                    const validation = validateEmail(registerEmail);
                    if (!validation.valid) {
                      setErrors(prev => ({
                        ...prev,
                        email: validation.error,
                      }));
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="user@example.com"
                  disabled={loading}
                />
                {errors.email && (
                  <AlertCircle className="absolute right-3 top-3 w-5 h-5 text-red-500" />
                )}
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
          )}

          {/* Full Name (chỉ Register) */}
          {!isLogin && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Họ và Tên</label>
              <div className="relative">
                <input
                  type="text"
                  value={registerFullName}
                  onChange={(e) => handleFullNameChange(e.target.value)}
                  onBlur={() => {
                    const validation = validateFullName(registerFullName);
                    if (!validation.valid) {
                      setErrors(prev => ({
                        ...prev,
                        fullName: validation.error,
                      }));
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                    errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nhập họ và tên của bạn"
                  disabled={loading}
                />
                {errors.fullName && (
                  <AlertCircle className="absolute right-3 top-3 w-5 h-5 text-red-500" />
                )}
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={isLogin ? loginPassword : registerPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={() => {
                  const validation = validatePassword(isLogin ? loginPassword : registerPassword);
                  if (!validation.valid && !isLogin) {
                    setErrors(prev => ({
                      ...prev,
                      password: validation.error,
                    }));
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition pr-10 ${
                  errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder={isLogin ? 'Mật khẩu của bạn' : 'Min 8 ký tự, 1 số, 1 in hoa, 1 đặc biệt'}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password (chỉ Register) */}
          {!isLogin && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Xác nhận mật khẩu</label>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={registerPasswordConfirm}
                  onChange={(e) => handlePasswordConfirmChange(e.target.value)}
                  onBlur={() => {
                    const validation = validatePasswordConfirm(registerPassword, registerPasswordConfirm);
                    if (!validation.valid) {
                      setErrors(prev => ({
                        ...prev,
                        passwordConfirm: validation.error,
                      }));
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition pr-10 ${
                    errors.passwordConfirm ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nhập lại mật khẩu"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.passwordConfirm && (
                <p className="text-red-500 text-xs mt-1">{errors.passwordConfirm}</p>
              )}
            </div>
          )}

          {/* Forgot Password (chỉ Login) */}
          {isLogin && (
            <div className="text-right">
              <button type="button" className="text-sm text-purple-500 hover:text-purple-600">
                Quên mật khẩu?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="mt-6 text-center text-gray-600">
          <p className="text-sm">
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button
              onClick={toggleForm}
              disabled={loading}
              className="text-indigo-500 hover:text-indigo-600 font-semibold ml-1 cursor-pointer disabled:opacity-50"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>

        {/* Password Requirements (khi Register) */}
        {!isLogin && (
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
            <p className="font-semibold text-blue-900 mb-2">Yêu cầu mật khẩu:</p>
            <ul className="space-y-1">
              <li className={registerPassword.length >= 8 ? 'text-green-600' : ''}>
                ✓ Ít nhất 8 ký tự
              </li>
              <li className={/[A-Z]/.test(registerPassword) ? 'text-green-600' : ''}>
                ✓ Ít nhất 1 chữ in hoa (A-Z)
              </li>
              <li className={/[a-z]/.test(registerPassword) ? 'text-green-600' : ''}>
                ✓ Ít nhất 1 chữ thường (a-z)
              </li>
              <li className={/[0-9]/.test(registerPassword) ? 'text-green-600' : ''}>
                ✓ Ít nhất 1 chữ số (0-9)
              </li>
              <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(registerPassword) ? 'text-green-600' : ''}>
                ✓ Ít nhất 1 ký tự đặc biệt (!@#$%^&*...)
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
```

================================================================================
## BƯỚC 3: TRIỂN KHAI TRÊN HỆ THỐNG - CÁC BƯỚC TỪNG BƯỚC
================================================================================

### BƯỚC 3.1: Backend - Cập nhật Dependencies (nếu cần)

Kiểm tra package.json đã có những package này chưa:
- ✓ bcrypt (hash password)
- ✓ class-validator (validation)
- ✓ class-transformer (DTO transformation)

Nếu chưa có, chạy:
```bash
npm install bcrypt class-validator class-transformer
```

### BƯỚC 3.2: Backend - Tạo các file mới

1. Tạo thư mục: `src/common/filters/`
2. Tạo file: `src/common/filters/http-exception.filter.ts` (xem BƯỚC 1.5)

### BƯỚC 3.3: Backend - Cập nhật các DTOs

1. Cập nhật: `src/users/dto/create-user.dto.ts` (xem BƯỚC 1.1)
2. Cập nhật: `src/users/dto/login-user.dto.ts` (xem BƯỚC 1.2)

### BƯỚC 3.4: Backend - Cập nhật Services & Controllers

1. Cập nhật: `src/users/users.service.ts` (xem BƯỚC 1.3)
2. Cập nhật: `src/users/users.controller.ts` (xem BƯỚC 1.4)
3. Cập nhật: `src/app.module.ts` (xem BƯỚC 1.6)

### BƯỚC 3.5: Backend - Test

```bash
# Terminal ở backend folder
cd backend/my-nestjs-backend

# Chạy development server
npm run start:dev

# Test endpoint:
# POST http://localhost:3000/users/register
# POST http://localhost:3000/users/login
```

### BƯỚC 3.6: Frontend - Tạo Utilities & Services

1. Tạo: `frontend/vite-project/src/utils/validation.ts` (xem BƯỚC 2.1)
2. Tạo: `frontend/vite-project/src/services/authService.ts` (xem BƯỚC 2.2)

### BƯỚC 3.7: Frontend - Cập nhật LoginPage Component

1. Cập nhật: `frontend/vite-project/src/components/LoginPage.tsx` (xem BƯỚC 2.3)

### BƯỚC 3.8: Frontend - Cài đặt Dependencies

```bash
# Terminal ở frontend folder
cd frontend/vite-project

# Cài các icon library nếu chưa có
npm install lucide-react

# Chạy development server
npm run dev
```

### BƯỚC 3.9: Test toàn hệ thống

1. Mở terminal 1: Backend
   ```bash
   cd backend/my-nestjs-backend
   npm run start:dev
   ```

2. Mở terminal 2: Frontend
   ```bash
   cd frontend/vite-project
   npm run dev
   ```

3. Truy cập: http://localhost:5173 (hoặc port frontend của bạn)

4. Test Register:
   - Username: testuser123
   - Email: test@example.com
   - Full Name: Test User
   - Password: Test@123456
   - Confirm: Test@123456

5. Test Login:
   - Email/Username: testuser123 hoặc test@example.com
   - Password: Test@123456

================================================================================
## BƯỚC 4: LỚP AUTHENTICATION/AUTHORIZATION (TIẾP THEO)
================================================================================

Sau khi register/login hoạt động, bạn cần:

### 4.1 Implement JWT Authentication

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/passport-jwt
```

### 4.2 Tạo JWT Strategy

File: `src/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

### 4.3 Tạo Auth Module

File: `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### 4.4 Sử dụng JWT Decorator

```typescript
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

================================================================================
## TÓM TẮT - CHECKLIST TRIỂN KHAI
================================================================================

### BACKEND:
☐ Cập nhật CreateUserDto với validation mạnh
☐ Cập nhật LoginUserDto
☐ Cập nhật UsersService (validation + error handling)
☐ Cập nhật UsersController (register/login endpoints)
☐ Tạo HttpExceptionFilter
☐ Integrate exception filter vào AppModule
☐ Test endpoints trên Postman
☐ Kiểm tra database (email/username unique)

### FRONTEND:
☐ Tạo validation.ts utilities
☐ Tạo authService.ts
☐ Cập nhật LoginPage component
☐ Cài lucide-react icons
☐ Test Register form
☐ Test Login form
☐ Kiểm tra localStorage
☐ Kiểm tra error messages

### TIẾP THEO (TODO):
☐ Implement JWT Authentication
☐ Add JWT token to login response
☐ Store token in localStorage
☐ Add Authorization headers to API calls
☐ Implement role-based access control
☐ Add password reset functionality
☐ Add email verification
☐ Add session management

================================================================================
