import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateFullName,
  validatePasswordConfirm,
  validateEmailOrUsername,
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
      if (isRegister) {
        const validation = validateUsername(value);
        setErrors(prev => ({
          ...prev,
          username: validation.valid ? undefined : validation.error,
        }));
      } else {
        // For login, validate as email or username
        const validation = validateEmailOrUsername(value);
        setErrors(prev => ({
          ...prev,
          username: validation.valid ? undefined : validation.error,
        }));
      }
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

    const emailOrUsernameValidation = validateEmailOrUsername(loginUsername);
    if (!emailOrUsernameValidation.valid) {
      newErrors.username = emailOrUsernameValidation.error;
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
                  const validation = isLogin 
                    ? validateEmailOrUsername(loginUsername)
                    : validateUsername(registerUsername);
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