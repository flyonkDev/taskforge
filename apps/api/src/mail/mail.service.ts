import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

    await this.resend.emails.send({
      from: 'TaskForge <onboarding@resend.dev>', // resend dev sender, работает без верификации домена
      to,
      subject: 'Verify your email',
      html: `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  }
}
