import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenService } from './refresh-token.service';
import { mapPrismaError } from '../common/prisma/utils';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
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

    // rotation: сначала отзываем старый
    await this.refreshTokenService.revoke(token);

    // находим пользователя для актуального payload
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

    // генерируем новую пару
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
}
