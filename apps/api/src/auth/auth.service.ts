import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../common/prisma/utils';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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

      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });

      return { accessToken: token };
    } catch (e: unknown) {
      throw mapPrismaError(e);
    }
  }
}
