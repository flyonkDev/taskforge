import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

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
}
