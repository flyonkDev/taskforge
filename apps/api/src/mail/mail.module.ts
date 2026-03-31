import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { EmailVerificationService } from './email-verification.service';

@Module({
  providers: [MailService, EmailVerificationService],
  exports: [MailService, EmailVerificationService],
})
export class MailModule {}
