================================================================================
              HƯỚNG DẪN QUICK START - TEST REGISTER/LOGIN
================================================================================

## BƯỚC 1: BACKEND - BUILD & RUN

Terminal 1 - Backend:
```bash
cd "d:\Year 4\web 4409\BTNHOM Local\backend\my-nestjs-backend"
npm run start:dev
```

Output sẽ hiển thị:
```
🚀 Application is running on: http://localhost:3000
```

## BƯỚC 2: FRONTEND - RUN

Terminal 2 - Frontend:
```bash
cd "d:\Year 4\web 4409\BTNHOM Local\frontend\vite-project"
npm run dev
```

Output sẽ hiển thị:
```
  VITE v... ready in ... ms

  ➜  Local:   http://localhost:5173/
```

## BƯỚC 3: TEST REGISTER

Truy cập: http://localhost:5173

Nhấn "Đăng ký ngay" để chuyển sang form Register

Điền thông tin:
- Email: testuser@example.com
- Username: testuser123
- Full Name: Test User
- Password: Test@123456
- Confirm Password: Test@123456

Nhấn "Đăng ký"

✓ Nếu thành công: Hiển thị "Đăng ký thành công! Chuyển sang đăng nhập..."
✗ Nếu lỗi: Hiển thị pesan lỗi cụ thể

## BƯỚC 4: TEST LOGIN

Sau khi đăng ký thành công, tự động chuyển sang Login form

Điền thông tin:
- Email/Username: testuser123 hoặc testuser@example.com
- Password: Test@123456

Nhấn "Đăng nhập"

✓ Nếu thành công: Hiển thị "Đăng nhập thành công!" rồi gọi onLogin()

## BƯỚC 5: TEST VALIDATION - FRONTEND

### Test Email Validation:
- Nhập: test (thiếu @) → Error: "Email không hợp lệ"
- Nhập: test@gmail (thiếu .com) → Error: "Email không hợp lệ"
- Nhập: test@gmail.com → ✓ OK

### Test Username Validation:
- Nhập: ab (quá ngắn) → Error: "Username ít nhất 3 ký tự"
- Nhập: test user (có space) → Error: "Username: 3-50 ký tự..."
- Nhập: testuser123 → ✓ OK

### Test Password Validation:
- Nhập: test123 (no uppercase) → Error: "1 chữ in hoa"
- Nhập: testABC (no number) → Error: "1 chữ số"
- Nhập: testABC123 (no special char) → Error: "1 ký tự đặc biệt"
- Nhập: Test@123456 → ✓ OK → Hiển thị password requirements checklist

### Test Password Confirm:
- Nhập confirm khác password → Error: "Mật khẩu xác nhận không khớp"
- Nhập confirm trùng password → ✓ OK

## BƯỚC 6: TEST VALIDATION - BACKEND (Postman)

### Test Register với dữ liệu invalid:

**1. Email không hợp lệ:**
```
POST http://localhost:3000/users/register
Body:
{
  "email": "invalidemail",
  "username": "testuser",
  "password": "Test@123456",
  "fullName": "Test User"
}

Response (400):
{
  "statusCode": 400,
  "message": "Email không hợp lệ. Ví dụ: user@example.com",
  ...
}
```

**2. Username quá ngắn:**
```
POST http://localhost:3000/users/register
Body:
{
  "email": "test@example.com",
  "username": "ab",
  "password": "Test@123456",
  "fullName": "Test User"
}

Response (400):
{
  "statusCode": 400,
  "message": "Username: 3-50 ký tự, chỉ chứa a-z, A-Z, 0-9, _, -",
  ...
}
```

**3. Password yếu (< 8 ký tự):**
```
POST http://localhost:3000/users/register
Body:
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "Test@12",
  "fullName": "Test User"
}

Response (400):
{
  "statusCode": 400,
  "message": "Password phải chứa ít nhất 8 ký tự, 1 chữ in hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt",
  ...
}
```

**4. Password không có uppercase:**
```
{
  "password": "test@123456"  // lowercase only
}

Response (400):
{
  "statusCode": 400,
  "message": "Password phải chứa ít nhất 8 ký tự, 1 chữ in hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt",
  ...
}
```

**5. Email đã tồn tại:**
```
# Register lần 1 thành công
POST http://localhost:3000/users/register
Body:
{
  "email": "duplicate@example.com",
  "username": "user1",
  "password": "Test@123456",
  "fullName": "User One"
}

# Register lần 2 cùng email
POST http://localhost:3000/users/register
Body:
{
  "email": "duplicate@example.com",
  "username": "user2",
  "password": "Test@123456",
  "fullName": "User Two"
}

Response (409):
{
  "statusCode": 409,
  "message": "Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập",
  ...
}
```

**6. Username đã tồn tại:**
```
# Register lần 2 cùng username
POST http://localhost:3000/users/register
Body:
{
  "email": "another@example.com",
  "username": "user1",  // Duplicate username
  "password": "Test@123456",
  "fullName": "User Three"
}

Response (409):
{
  "statusCode": 409,
  "message": "Username này đã tồn tại. Vui lòng chọn username khác",
  ...
}
```

### Test Register thành công:

```
POST http://localhost:3000/users/register
Body:
{
  "email": "newuser@example.com",
  "username": "newuser123",
  "password": "SecurePass@2025",
  "fullName": "New User"
}

Response (201):
{
  "statusCode": 201,
  "message": "Đăng ký thành công. Vui lòng đăng nhập",
  "user": {
    "id": 1,
    "email": "newuser@example.com",
    "username": "newuser123",
    "fullName": "New User",
    "status": "active",
    "createdAt": "2025-12-11T10:30:00Z",
    "updatedAt": "2025-12-11T10:30:00Z"
  }
}
```

### Test Login:

**1. Email/Username không tồn tại:**
```
POST http://localhost:3000/users/login
Body:
{
  "emailOrUsername": "notexist@example.com",
  "password": "AnyPassword@123"
}

Response (400):
{
  "statusCode": 400,
  "message": "Email/Username hoặc mật khẩu không đúng",
  ...
}
```

**2. Password sai:**
```
POST http://localhost:3000/users/login
Body:
{
  "emailOrUsername": "newuser123",
  "password": "WrongPassword@123"
}

Response (400):
{
  "statusCode": 400,
  "message": "Email/Username hoặc mật khẩu không đúng",
  ...
}
```

**3. Login thành công:**
```
POST http://localhost:3000/users/login
Body:
{
  "emailOrUsername": "newuser123",
  "password": "SecurePass@2025"
}

Response (200):
{
  "statusCode": 200,
  "message": "Đăng nhập thành công",
  "user": {
    "id": 1,
    "email": "newuser@example.com",
    "username": "newuser123",
    "fullName": "New User",
    "status": "active",
    "createdAt": "2025-12-11T10:30:00Z",
    "updatedAt": "2025-12-11T10:30:00Z"
  }
}
```

**4. Login bằng email:**
```
POST http://localhost:3000/users/login
Body:
{
  "emailOrUsername": "newuser@example.com",
  "password": "SecurePass@2025"
}

Response (200):
{
  "statusCode": 200,
  "message": "Đăng nhập thành công",
  "user": { ... }
}
```

## BƯỚC 7: KIỂM TRA DATABASE

Kết nối tới PostgreSQL và kiểm tra bảng users:

```sql
SELECT id, email, username, full_name, status, created_at FROM users;
```

Sẽ thấy:
- email là unique
- username là unique
- password được hash bằng bcrypt (không thể đọc được)
- status = 'active' (mặc định)
- created_at được set tự động

## BƯỚC 8: KIỂM TRA FRONTEND localStorage

Sau khi login thành công, mở DevTools (F12) → Application → localStorage

Sẽ thấy:
```
user: {
  "id": 1,
  "email": "newuser@example.com",
  "username": "newuser123",
  "fullName": "New User",
  "status": "active",
  ...
}
```

## KIẾN TRÚC ĐÃ TRIỂN KHAI

### Backend:
✓ CreateUserDto - Validation từ class-validator
✓ LoginUserDto - Validation basic
✓ UsersService - create() & validateUser() logic
✓ UsersController - POST /users/register & /login endpoints
✓ HttpExceptionFilter - Error handling global
✓ AppModule - Integrate exception filter
✓ Bcrypt - Password hashing
✓ Database - Constraints (unique email/username)

### Frontend:
✓ validation.ts - Client-side validators
✓ authService.ts - API integration
✓ LoginPage.tsx - UI với real-time validation

## NHỮNG VIỆC CẦN LÀM TIẾP THEO

☐ Implement JWT Authentication (Issue tokens sau khi login)
☐ Add JWT verification middleware
☐ Protect API endpoints với @UseGuards(AuthGuard('jwt'))
☐ Add refresh token logic
☐ Implement password reset functionality
☐ Add email verification
☐ Add rate limiting (prevent brute force)
☐ Add session management
☐ Implement role-based access control
☐ Add audit logging

================================================================================
