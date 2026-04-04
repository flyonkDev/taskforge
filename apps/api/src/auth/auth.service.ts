import {
  Injectable,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { mapPrismaError } from '../common/prisma/utils';

import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenService } from './refresh-token.service';
import { EmailVerificationService } from '../mail/email-verification.service';
import { MailService } from '../mail/mail.service';
import { PasswordResetService } from './password-reset.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly mailService: MailService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash: hashedPassword,
        },
      });

      await this.sendVerificationEmail(user.id, user.email);

      return { id: user.id, email: user.email };
    } catch (e: unknown) {
      throw mapPrismaError(e);
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: {
          id: true,
          email: true,
          role: true,
          passwordHash: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);

      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = await this.refreshTokenService.generate(user.id);

      return { accessToken, refreshToken };
    } catch (e: unknown) {
      throw mapPrismaError(e);
    }
  }

  async refresh(token: string) {
    const userId = await this.refreshTokenService.validate(token);

    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokenService.revoke(token);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const newRefreshToken = await this.refreshTokenService.generate(userId);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(token: string): Promise<void> {
    await this.refreshTokenService.revoke(token);
  }

  async sendVerificationEmail(userId: number, email: string): Promise<void> {
    const token = await this.emailVerificationService.generateToken(userId);
    await this.mailService.sendVerificationEmail(email, token);
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.emailVerificationService.validateToken(token);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    await this.emailVerificationService.consumeToken(token);
  }

  async resendVerificationEmail(userId: number, email: string): Promise<void> {
    const canResend = await this.emailVerificationService.canResend(userId);

    if (!canResend) {
      throw new HttpException(
        'Please wait before requesting another email',
        429,
      );
    }

    await this.emailVerificationService.markResendSent(userId);
    await this.sendVerificationEmail(userId, email);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return;
    }

    const canRequest = await this.passwordResetService.canRequest(user.id);

    if (!canRequest) {
      return;
    }

    const token = await this.passwordResetService.generateToken(user.id);

    await this.mailService.sendPasswordResetEmail(email, token);

    await this.passwordResetService.markRequested(user.id);

    return;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.passwordResetService.validateToken(token);
    if (!userId) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
    await this.passwordResetService.consumeToken(token);

    await this.refreshTokenService.revokeAll(userId);
  }
}
