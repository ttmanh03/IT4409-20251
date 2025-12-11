# Email Verification API Endpoints

## 📧 Email Verification Endpoints

### 1. Register (Đăng ký)
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

**Status**: 201 Created  
**Response**:
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

**Flow**:
- Backend tạo verification token (hợp lệ 24 giờ)
- Gửi email chứa link: `http://localhost:5173/verify-email?token=xxx`
- User click link để verify

---

### 2. Verify Email (Xác thực Email)
```http
POST /users/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}
```

**Status**: 200 OK  
**Response**:
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

**Error Cases**:
- Token invalid: `400 Bad Request`
- Token expired: `400 Bad Request`  
- Email already verified: `400 Bad Request`

---

### 3. Resend Verification Email (Gửi Lại Email)
```http
POST /users/resend-verification-email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Status**: 200 OK  
**Response**:
```json
{
  "statusCode": 200,
  "message": "Email xác thực đã được gửi lại"
}
```

**Use Cases**:
- User không nhận email lần đầu
- User click link lần 2 (token mới được tạo)
- Resend sau khi hết hạn

---

### 4. Login (Đăng nhập)
```http
POST /users/login
Content-Type: application/json

{
  "emailOrUsername": "user@example.com",
  "password": "SecurePass123!"
}
```

**Status**: 200 OK  
**Response**:
```json
{
  "statusCode": 200,
  "message": "Đăng nhập thành công",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "emailVerified": true,
    "createdAt": "2025-12-11T..."
  }
}
```

**Note**: 
- `emailOrUsername` có thể là email hoặc username
- Hiện tại không check `emailVerified` (optional - bạn có thể thêm)
- JWT token sẽ được thêm trong bước tiếp theo

---

## 🔄 Complete Flow

```
1. User Register
   ├─ POST /users/register
   ├─ Backend tạo token + gửi email
   └─ Frontend show: "Kiểm tra email"

2. User nhận Email với link verify
   ├─ Link: /verify-email?token=xxx
   └─ Frontend navigate tới page này

3. User click link
   ├─ Frontend submit token tới /users/verify-email
   ├─ Backend verify + cập nhật emailVerified = true
   └─ Frontend redirect tới /login

4. User Login
   ├─ POST /users/login
   ├─ Backend kiểm tra password
   └─ Frontend save user + redirect tới dashboard
```

---

## 📝 Database Schema (Users Table)

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  avatar_url VARCHAR(500),
  status user_status DEFAULT 'active',
  
  -- Email verification fields
  email_verified BOOLEAN DEFAULT false NOT NULL,
  verification_token VARCHAR(255),
  verification_token_expiry TIMESTAMP WITH TIME ZONE,
  
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_verification_token ON users(verification_token);
```

---

## 🧪 Testing với Postman

### Test 1: Register
```
POST http://localhost:3000/users/register
Headers: Content-Type: application/json

Body:
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "TestPass123!",
  "fullName": "Test User"
}
```

### Test 2: Resend Email
```
POST http://localhost:3000/users/resend-verification-email
Headers: Content-Type: application/json

Body:
{
  "email": "test@example.com"
}
```

### Test 3: Verify Email
```
POST http://localhost:3000/users/verify-email
Headers: Content-Type: application/json

Body:
{
  "token": "copy_token_from_email_here"
}
```

### Test 4: Login
```
POST http://localhost:3000/users/login
Headers: Content-Type: application/json

Body:
{
  "emailOrUsername": "test@example.com",
  "password": "TestPass123!"
}
```

---

## 🚀 Running the Application

### Terminal 1: Backend
```bash
cd backend/my-nestjs-backend
npm run start:dev
```

### Terminal 2: Frontend
```bash
cd frontend/vite-project
npm run dev
```

### Frontend Routes
- `/register` - Trang đăng ký
- `/login` - Trang đăng nhập
- `/verify-email?token=xxx` - Trang xác thực email (auto)

---

## ⚙️ Environment Variables (.env)

```env
# Backend - database/my-nestjs-backend/.env

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/btnhom

# SendGrid
SENDGRID_API_KEY=SG.xxxxx_your_api_key_xxxxx
SENDGRID_FROM_EMAIL=noreply@btnhom.com

# Frontend URL (để tạo verify link)
FRONTEND_URL=http://localhost:5173
```

---

## ✅ Checklist Implementation

- [x] Email service với SendGrid
- [x] Schema update (emailVerified, verificationToken)
- [x] DTO create + verify email
- [x] Service methods (create, verify, resend)
- [x] Controller endpoints
- [x] Frontend VerifyEmail component
- [ ] Add JWT token generation
- [ ] Add email verification requirement before login
- [ ] Add password reset functionality
- [ ] Add email notification templates
