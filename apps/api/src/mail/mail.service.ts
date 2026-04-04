import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

    await this.resend.emails.send({
      from: 'TaskForge <onboarding@resend.dev>',
      to,
      subject: 'Verify your email',
      html: `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetLink = `${this.configService.get('APP_URL')}/auth/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: 'TaskForge <onboarding@resend.dev>',
      to,
      subject: 'TaskForge — Password Reset',
      html: `<p>Click to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
    });
  }
}
