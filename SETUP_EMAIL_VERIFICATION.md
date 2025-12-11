# Setup Email Verification với Gmail

Hướng dẫn này sẽ giúp bạn setup tính năng gửi email xác thực từ tài khoản Gmail cá nhân.

## 📋 Yêu cầu

- Tài khoản Google
- 2FA (Two-Factor Authentication) đã bật

## 🔧 Các Bước Setup

### 1. Bật Two-Factor Authentication (2FA)

1. Truy cập: https://myaccount.google.com/
2. Click **Security** (Bảo mật) ở bên trái
3. Tìm mục **2-Step Verification** (Xác minh 2 bước)
4. Click **Get started** và làm theo hướng dẫn
5. Chọn phương thức xác nhận (SMS hoặc Authenticator app)

### 2. Tạo App Password

1. Sau khi bật 2FA, quay lại **Security**
2. Tìm mục **App passwords** (Mật khẩu ứng dụng)
   - Nếu không thấy, hãy kiểm tra là bạn đã bật 2FA chưa
3. Chọn:
   - **Select the app**: Mail (Thư)
   - **Select the device**: Windows Computer (Máy tính Windows)
4. Google sẽ tạo mật khẩu 16 ký tự: `xxxx xxxx xxxx xxxx`
5. **Copy mật khẩu này**

### 3. Cấu hình `.env` file

Thêm các biến sau vào file `.env` của backend:

```env
# Email Configuration
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
FRONTEND_URL=http://localhost:5173
```

**Lưu ý**: Sử dụng **App Password** (16 ký tự), không phải mật khẩu Gmail thường!

### 4. Kiểm tra cấu hình

```bash
cd backend/my-nestjs-backend

# Chạy backend
npm run start:dev
```

### 5. Test gửi email

#### Via Postman:
1. **URL**: `POST http://localhost:3000/users/register`
2. **Body (JSON)**:
```json
{
  "email": "test@example.com",
  "username": "testuser123",
  "password": "Password123!@#",
  "fullName": "Test User"
}
```

3. Kiểm tra trong console backend xem có log "Email xác thực được gửi đến test@example.com"
4. Nếu có lỗi "EAUTH", check lại:
   - EMAIL_PASSWORD có chính xác không?
   - Đã tắt "Less secure app access" chưa?
   - Gmail account có bị block không?

## 🚀 Sử dụng

### 1. Đăng ký tài khoản
**Request**: 
```
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "myusername",
  "password": "SecurePass123!",
  "fullName": "Full Name"
}
```

**Response**:
```json
{
  "statusCode": 201,
  "message": "Đăng ký thành công. Vui lòng đăng nhập",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "myusername",
    "fullName": "Full Name",
    "emailVerified": false,
    "createdAt": "2025-12-11T10:30:00Z"
  }
}
```

**Email sẽ được gửi với nội dung xác thực**

### 2. Click link trong email hoặc verify bằng token

**Request**:
```
POST /users/verify-email
Content-Type: application/json

{
  "token": "token_từ_email_hoặc_link"
}
```

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

### 3. Gửi lại email xác thực (nếu email bị mất)

**Request**:
```
POST /users/resend-verification-email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "statusCode": 200,
  "message": "Email xác thực đã được gửi lại"
}
```

## ❌ Xử lý Lỗi Phổ Biến

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-----------|---------|
| `EAUTH: Invalid login` | App Password sai | Kiểm tra lại `.env` file |
| `EAUTH: Please log in via your web browser` | Gmail cần xác nhận | Vào Gmail account làm theo hướng dẫn |
| `ENOTFOUND: getaddrinfo ENOTFOUND smtp.gmail.com` | Không kết nối internet hoặc DNS | Kiểm tra kết nối mạng |
| `Token xác thực đã hết hạn` | Token cũ hơn 24 giờ | Gửi lại email xác thực |
| `Email đã được xác thực` | Email đã verify trước đó | Có thể đăng nhập bình thường |

## 📧 Cách khác để gửi Email

### Option 1: SendGrid (Khuyến nghị cho Production)
```bash
npm install @nestjs/mailer nodemailer @sendgrid/mail
```

### Option 2: AWS SES
```bash
npm install aws-sdk
```

### Option 3: Mailgun
```bash
npm install mailgun.js
```

## 🔒 Bảo Mật

- ✅ Không commit `.env` file vào Git
- ✅ Sử dụng App Password, không phải mật khẩu thường
- ✅ Token xác thực hết hạn sau 24 giờ
- ✅ Token được hash trong database (nên implement sau)

## 📝 Tiếp Theo

1. Implement JWT token generation khi login
2. Thêm check `emailVerified` trước khi login
3. Implement password reset email
4. Thêm rate limiting để prevent spam
