import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const EMAIL = this.configService.get<string>("EMAIL");
    const PASSWORD = this.configService.get<string>("PASSWORD");

    if (!EMAIL || !PASSWORD) {
      throw new ServiceUnavailableException(
        "Email service not configured. Missing EMAIL or PASSWORD environment variables.",
      );
    }

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    });
  }

  async Mailer(
    to: string,
    dto: { code: string; expiresAt: Date },
  ): Promise<string> {
    const msg = {
      to: to,
      from: process.env.EMAIL,
      subject: "كود التحقق",
      text: "ادخل كود التحقق في الموقع قبل 15 دقيقه نسمح فقط بمحاولتان",
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fafafa; text-align: center;">
    <h2 style="color: #333;">Email Verification</h2>
    <p style="font-size: 14px; color: #555;">
      استخدم الكود أدناه لتأكيد بريدك الإلكتروني. الكود صالح لمدة 15 دقيقة.
    </p>
    <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #2d89ef; margin: 20px 0;">
      ${dto.code}
    </div>
    <p style="font-size: 12px; color: #999;">
      إذا لم تطلب هذا الكود تجاهل هذه الرسالة.
    </p>
  </div>
`,
    };

    try {
      await this.transporter.sendMail(msg);
      return "the Email sent!";
    } catch (error) {
      console.error(error);
      throw new ServiceUnavailableException(
        "Failed to send verification email. Please try again later.",
      );
    }
  }

  async sendPasswordResetEmail(
    to: string,
    dto: { code: string; expiresAt: Date },
  ): Promise<string> {
    const msg = {
      to: to,
      from: process.env.EMAIL,
      subject: "إعادة تعيين كلمة المرور",
      text: "استخدم الرقم الموجود وضعه في الموقعنا",
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fafafa; text-align: center;">
    <h2 style="color: #333;">Password Reset</h2>
    <p style="font-size: 14px; color: #555;">
      استخدم الرقم أدناه لإعادة تعيين كلمة المرور الخاصة بك. الرقم صالح لمدة ساعة واحدة.
    </p>
    <div style="font-size: 12px; font-family: monospace; color: #2d89ef; margin: 20px 0; padding: 10px; background: #f0f0f0; border-radius: 4px; word-break: break-all;">
      ${dto.code}
    </div>
    <p style="font-size: 12px; color: #999;">
      إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة.
    </p>
  </div>
`,
    };

    try {
      await this.transporter.sendMail(msg);
      return "Password reset email sent!";
    } catch (error) {
      console.error(error);
      throw new ServiceUnavailableException(
        "Failed to send password reset email. Please try again later.",
      );
    }
  }
}
