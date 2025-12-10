import React, { useState } from 'react';
import { Facebook, MessageCircle } from 'lucide-react';

interface LoginPageProps {
    onLogin: () => void;
}


const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    if (isLogin) {
      console.log('Login:', { username, password });
      onLogin();
    } else {
      console.log('Register:', { username, email, password });
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo và Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-500 mb-2">Jira</h1>
          <p className="text-purple-400 text-lg">
            {isLogin ? 'Login to continue' : 'Register to get started'}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Username:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Enter your username"
            />
          </div>

          {/* Email (chỉ hiển thị khi Register) */}
          {!isLogin && (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="Enter your email"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Enter your password"
            />
          </div>

          {/* Forgot Password (chỉ hiển thị khi Login) */}
          {isLogin && (
            <div className="text-right">
              <button className="text-sm text-purple-500 hover:text-purple-600">
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-full transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </div>

        {/* Toggle Login/Register */}
        <div className="text-center mt-6">
          <p className="text-gray-700 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-500 hover:text-purple-600 font-semibold"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="flex justify-center space-x-4">
          <button className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition duration-200 shadow-md hover:shadow-lg transform hover:scale-110">
            <Facebook size={24} />
          </button>
          
          <button className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition duration-200 shadow-md hover:shadow-lg transform hover:scale-110">
            <MessageCircle size={24} />
          </button>
          
          <button className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center transition duration-200 shadow-md hover:shadow-lg transform hover:scale-110">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
            </svg>
          </button>
        </div>

        {/* Terms */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <button className="text-purple-500 hover:text-purple-600">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-purple-500 hover:text-purple-600">
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;