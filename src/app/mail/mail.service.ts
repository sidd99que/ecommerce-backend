// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  // ── Order Confirmation Email ──────────────────────────────────────────────
  async sendOrderConfirmation(order: any): Promise<void> {
    try {
      const { userEmail, orderNumber, items, shippingAddress, totals, paymentMethod } = order;

      const itemsHtml = items
        .map(
          (item: any) => `
          <tr>
            <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;">
              ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;"/>` : ''}
              <span style="font-size:14px;color:#111;">${item.name}</span>
            </td>
            <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#555;">x${item.quantity}</td>
            <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;font-weight:600;color:#111;">Rs ${(item.price * item.quantity).toLocaleString()}</td>
          </tr>
        `,
        )
        .join('');

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#111;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:4px;">FASCO</h1>
      <p style="margin:8px 0 0;color:#aaa;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Order Confirmation</p>
    </div>
    <div style="padding:40px;">
      <h2 style="margin:0 0 8px;font-size:22px;color:#111;">Thank you for your order! 🎉</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#666;">Hi ${shippingAddress?.fullName || 'there'}, your order has been placed successfully.</p>
      <div style="background:#f9f9f9;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
        <p style="margin:0;font-size:12px;color:#aaa;text-transform:uppercase;">Order Number</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#111;">${orderNumber}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="background:#f9f9f9;border-radius:10px;padding:20px;margin-bottom:28px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:14px;color:#666;">Subtotal</span>
          <span style="font-size:14px;">Rs ${totals?.subtotal?.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:14px;color:#666;">Shipping</span>
          <span style="font-size:14px;">${totals?.shippingFee === 0 ? 'Free' : `Rs ${totals?.shippingFee?.toLocaleString()}`}</span>
        </div>
        <div style="border-top:1px solid #e5e5e5;padding-top:12px;display:flex;justify-content:space-between;">
          <span style="font-size:16px;font-weight:700;">Total</span>
          <span style="font-size:16px;font-weight:700;">Rs ${totals?.total?.toLocaleString()}</span>
        </div>
      </div>
      <div style="text-align:center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders"
          style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;">
          View My Orders
        </a>
      </div>
    </div>
    <div style="background:#f9f9f9;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:12px;color:#aaa;">You received this email because you placed an order on FASCO.</p>
    </div>
  </div>
</body>
</html>`;

      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM') || 'FASCO <msidd99que@gmail.com>',
        to: userEmail,
        subject: `✅ Order Confirmed — ${orderNumber}`,
        html,
      });

      this.logger.log(`📧 Order confirmation sent to ${userEmail}`);
    } catch (error) {
      this.logger.error(`❌ Order email failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ── Password Reset Email ──────────────────────────────────────────────────
  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    username?: string,
  ): Promise<void> {
    try {
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <div style="background:#111;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:4px;">FASCO</h1>
      <p style="margin:8px 0 0;color:#aaa;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Password Reset</p>
    </div>

    <div style="padding:40px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:48px;margin-bottom:16px;">🔑</div>
        <h2 style="margin:0 0 8px;font-size:22px;color:#111;font-weight:600;">Reset Your Password</h2>
        <p style="margin:0;font-size:15px;color:#666;">
          Hi ${username || 'there'}, we received a request to reset your FASCO password.
        </p>
      </div>

      <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 24px;">
        Click the button below to reset your password. This link will expire in
        <strong style="color:#111;">15 minutes</strong>.
      </p>

      <div style="text-align:center;margin-bottom:28px;">
        <a href="${resetUrl}"
          style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:15px;font-weight:600;">
          Reset Password →
        </a>
      </div>

      <div style="background:#f9f9f9;border:1px solid #eee;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
          🔒 If you didn't request a password reset, you can safely ignore this email.
          Your password will not be changed.
        </p>
      </div>

      <p style="font-size:12px;color:#aaa;line-height:1.6;word-break:break-all;">
        If the button doesn't work, copy this link into your browser:<br/>
        <a href="${resetUrl}" style="color:#555;">${resetUrl}</a>
      </p>
    </div>

    <div style="background:#f9f9f9;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:12px;color:#aaa;">
        This link expires in 15 minutes. © FASCO
      </p>
    </div>
  </div>
</body>
</html>`;

      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM') || 'FASCO <msidd99que@gmail.com>',
        to: email,
        subject: '🔑 Reset Your FASCO Password',
        html,
      });

      this.logger.log(`📧 Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Password reset email failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}