import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor() {
    // Khởi tạo SendGrid với API Key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendVerificationEmail(
    toEmail: string,
    fullName: string,
    verificationToken: string,
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    const msg = {
      to: toEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@btnhom.com',
      subject: 'Xác thực email - BTNHOM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-bottom: 20px;">Xác thực Email - BTNHOM</h2>
            
            <p style="color: #555; font-size: 16px;">
              Xin chào <strong>${fullName}</strong>,
            </p>
            
            <p style="color: #555; font-size: 16px; margin: 15px 0;">
              Cảm ơn bạn đã đăng ký tài khoản BTNHOM. Vui lòng xác thực email của bạn bằng cách nhấp vào nút dưới đây:
            </p>
            
            <div style="margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Xác thực Email
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; margin: 20px 0;">
              Hoặc sao chép link này vào trình duyệt:
            </p>
            <p style="color: #7c3aed; font-size: 12px; word-break: break-all;">
              ${verificationUrl}
            </p>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              Link xác thực này sẽ hết hạn trong 24 giờ.<br>
              Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`Email xác thực được gửi đến ${toEmail}`);
    } catch (error) {
      console.error('Lỗi khi gửi email:', error);
      throw new Error('Không thể gửi email xác thực');
    }
  }

  async sendPasswordResetEmail(
    toEmail: string,
    fullName: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const msg = {
      to: toEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@btnhom.com',
      subject: 'Đặt lại mật khẩu - BTNHOM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-bottom: 20px;">Đặt lại Mật khẩu - BTNHOM</h2>
            
            <p style="color: #555; font-size: 16px;">
              Xin chào <strong>${fullName}</strong>,
            </p>
            
            <p style="color: #555; font-size: 16px; margin: 15px 0;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút dưới đây để tạo mật khẩu mới:
            </p>
            
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Đặt lại Mật khẩu
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; margin: 20px 0;">
              Hoặc sao chép link này vào trình duyệt:
            </p>
            <p style="color: #7c3aed; font-size: 12px; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              Link này sẽ hết hạn trong 1 giờ.<br>
              Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`Email đặt lại mật khẩu được gửi đến ${toEmail}`);
    } catch (error) {
      console.error('Lỗi khi gửi email:', error);
      throw new Error('Không thể gửi email đặt lại mật khẩu');
    }
  }

  async sendWelcomeEmail(toEmail: string, fullName: string): Promise<void> {
    const msg = {
      to: toEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@btnhom.com',
      subject: 'Chào mừng bạn đến BTNHOM!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-bottom: 20px;">Chào mừng đến BTNHOM! 🎉</h2>
            
            <p style="color: #555; font-size: 16px;">
              Xin chào <strong>${fullName}</strong>,
            </p>
            
            <p style="color: #555; font-size: 16px; margin: 15px 0;">
              Tài khoản của bạn đã được tạo thành công. Bây giờ bạn có thể:
            </p>
            
            <ul style="color: #555; font-size: 16px; margin: 15px 0; padding-left: 20px;">
              <li>Tạo và quản lý dự án</li>
              <li>Làm việc nhóm với các thành viên</li>
              <li>Theo dõi tiến độ công việc</li>
              <li>Cộng tác trực tuyến với đội</li>
            </ul>
            
            <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`Email chào mừng được gửi đến ${toEmail}`);
    } catch (error) {
      console.error('Lỗi khi gửi email:', error);
      throw new Error('Không thể gửi email chào mừng');
    }
  }
}
