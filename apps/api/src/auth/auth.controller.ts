import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  HttpCode,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload';
import { SkipEmailVerification } from './decorators/skip-email-verification.decorator';

type RefreshRequest = Request & {
  refreshToken: string;
  refreshUserId: number;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Req() req: RefreshRequest) {
    return this.authService.refresh(req.refreshToken);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: RefreshRequest) {
    return this.authService.logout(req.refreshToken);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @SkipEmailVerification()
  @HttpCode(204)
  async resendVerification(@CurrentUser() user: JwtPayload) {
    const email = user.email;
    await this.authService.resendVerificationEmail(user.sub, email);
  }
}
