import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Token xác thực không hợp lệ. Vui lòng đăng ký lại');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/users/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email xác thực thành công!');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Xác thực email thất bại');
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage('Lỗi khi xác thực email. Vui lòng thử lại');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-600">BTNHOM</h1>
        </div>

        {/* Content */}
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader className="w-16 h-16 mx-auto mb-4 text-purple-500 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang xác thực email...</h2>
              <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác thực thành công!</h2>
              <p className="text-green-600 mb-6">{message}</p>
              <p className="text-gray-600 text-sm">Chuyển hướng đến trang đăng nhập trong 3 giây...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác thực thất bại</h2>
              <p className="text-red-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full bg-purple-500 text-white py-2 rounded-lg font-semibold hover:bg-purple-600 transition"
                >
                  Đăng ký lại
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Về trang đăng nhập
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
