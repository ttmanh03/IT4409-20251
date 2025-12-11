// Validation rules for register/login

export const ValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email không hợp lệ. Ví dụ: user@example.com',
  },
  username: {
    pattern: /^[a-zA-Z0-9_-]{3,50}$/,
    message: 'Username: 5-20 ký tự, chỉ chứa a-z, A-Z, 0-9, _, -',
    minLength: 3,
    maxLength: 50,
  },
  emailOrUsername: {
    message: 'Email hoặc Username không hợp lệ',
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

// Validate email hoặc username (dùng cho login)
export const validateEmailOrUsername = (value: string): { valid: boolean; error?: string } => {
  if (!value) return { valid: false, error: 'Email/Username là bắt buộc' };

  const isEmail = ValidationRules.email.pattern.test(value);
  const isUsername = ValidationRules.username.pattern.test(value);

  if (!isEmail && !isUsername) {
    return {
      valid: false,
      error: 'Email và Username không hợp lệ. Email: user@example.com, Username: 5-20 ký tự (a-z, A-Z, 0-9, _, -)',
    };
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