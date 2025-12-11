# Setup Email Verification với SendGrid

## 📋 Bước 1: Tạo Tài khoản SendGrid

1. **Đăng ký tài khoản miễn phí**
   - Truy cập: https://sendgrid.com/
   - Chọn "Sign Up" → Tạo tài khoản
   - Xác thực email

2. **Xác minh Domain (tùy chọn nhưng được khuyến nghị)**
   - Vào **Settings > Sender Authentication > Verify a Domain**
   - Thêm domain của bạn (ví dụ: `api.btnhom.com`)
   - Theo dõi các bước DNS setup

3. **Xác minh Single Sender Email**
   - Nếu không có domain, xác minh single sender:
   - **Settings > Sender Authentication > Verify a Single Sender**
   - Nhập email gửi từ (ví dụ: `noreply@btnhom.com`)
   - SendGrid sẽ gửi link xác thực

---

## 🔑 Bước 2: Lấy API Key

1. Vào **Settings > API Keys**
2. Click **"Create API Key"**
3. Chọn **Full Access** (hoặc custom permissions)
4. Copy API Key (có dạng: `SG.xxxxx_long_key_xxxxx`)
5. **Lưu ý**: Chỉ hiển thị 1 lần, nên copy lại ngay!

---

## 🔧 Bước 3: Cấu hình Backend

### 3.1 Tạo file `.env` trong backend folder

```bash
cd backend/my-nestjs-backend
```

Tạo hoặc chỉnh sửa file `.env`:

```env
# Database
DATABASE_URL=postgresql://...

# Email - SendGrid
SENDGRID_API_KEY=SG.xxxxx_your_api_key_xxxxx
SENDGRID_FROM_EMAIL=noreply@btnhom.com

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 3.2 Cấu hình file schema & database

Schema đã được cập nhật với các fields:
- `emailVerified`: boolean (default: false)
- `verificationToken`: varchar
- `verificationTokenExpiry`: timestamp

**Migration cần thiết:**

```sql
ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN verification_token varchar(255);
ALTER TABLE users ADD COLUMN verification_token_expiry timestamp with time zone;
CREATE INDEX idx_users_verification_token ON users (verification_token);
```

Hoặc sử dụng Drizzle:
```bash
npm run drizzle:generate
npm run drizzle:push
```

---

## 📧 Bước 4: API Endpoints

### Đăng ký (Register)
```http
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username123",
  "password": "SecurePass123!",
  "fullName": "User Name"
}
```

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username123",
    "fullName": "User Name",
    "emailVerified": false,
    "createdAt": "2025-12-11T..."
  }
}
```

→ **User nhận email chứa link xác thực**

---

### Xác thực Email (Verify)
```http
POST /users/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Email xác thực thành công. Bạn có thể đăng nhập ngay",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

---

### Gửi Lại Email Xác thực
```http
POST /users/resend-verification-email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Email xác thực đã được gửi lại"
}
```

---

### Đăng nhập (Login)
```http
POST /users/login
Content-Type: application/json

{
  "emailOrUsername": "user@example.com",
  "password": "SecurePass123!"
}
```

---

## 🎯 Bước 5: Frontend Setup

### 5.1 Tạo VerifyEmail Component

```typescript
// src/components/VerifyEmail.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Token không hợp lệ');
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
          setMessage(data.message);
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Xác thực email thất bại');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Lỗi xác thực email');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {status === 'loading' && <p>Đang xác thực email...</p>}
      {status === 'success' && (
        <div className="text-green-600 text-center">
          <p className="text-xl font-bold mb-2">✓ {message}</p>
          <p>Redirecting to login...</p>
        </div>
      )}
      {status === 'error' && (
        <div className="text-red-600 text-center">
          <p className="text-xl font-bold mb-2">✗ {message}</p>
        </div>
      )}
    </div>
  );
}
```

### 5.2 Cập nhật Router

```typescript
// src/main.tsx
import { VerifyEmail } from './components/VerifyEmail';

const router = [
  // ... other routes
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },
];
```

---

## ✅ Testing

### Test 1: Register & Verify
1. Mở http://localhost:5173/register
2. Điền form và submit
3. Kiểm tra email nhận được (check spam folder)
4. Click link verify
5. Login thành công

### Test 2: Resend Email
1. Sau khi register, call API resend:
```bash
curl -X POST http://localhost:3000/users/resend-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Test 3: Postman
1. POST http://localhost:3000/users/register
```json
{
  "email": "test@sendgrid.com",
  "username": "testuser",
  "password": "TestPass123!",
  "fullName": "Test User"
}
```

2. Copy token từ email
3. POST http://localhost:3000/users/verify-email
```json
{
  "token": "paste_token_here"
}
```

---

## 📊 Quota SendGrid Miễn Phí

- **Free tier**: 1,000 emails/tháng
- **Paid plan**: $19.95/tháng (100,000 emails)
- **Billing**: Hỗ trợ multiple authentication domains

---

## 🚨 Troubleshooting

### Email không nhận được
1. **Kiểm tra spam folder** - Đôi khi email đi vào junk
2. **Xác nhận SendGrid sender** - Vào Settings > Sender Authentication
3. **Kiểm tra API Key** - Đảm bảo key đúng và còn hiệu lực
4. **Logs backend**: 
   ```bash
   npm run start:dev
   # Check terminal for email sending logs
   ```

### Token expired
- Token hết hạn sau 24 giờ
- User cần click "Resend Email" để nhận token mới

### 403 Forbidden Error
- Đảm bảo sender email được verify trong SendGrid
- Hoặc setup domain authentication

---

## 🔒 Security Tips

1. **Không commit `.env`** - Thêm vào `.gitignore`
2. **Rotate API Keys** - Thay đổi định kỳ
3. **HTTPS only** - Không gửi token qua HTTP
4. **Token expiry** - Token có thời hạn 24 giờ
5. **Rate limiting** - Cân nhắc thêm rate limit cho resend

---

## 📝 Next Steps

- [ ] Implement JWT tokens
- [ ] Add password reset functionality
- [ ] Setup email templates với Handlebars
- [ ] Email notifications cho events
- [ ] Webhook handling từ SendGrid
