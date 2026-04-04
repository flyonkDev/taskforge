import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConfig } from '../config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { RolesGuard } from './guards/roles.guard';

import { RefreshTokenService } from './refresh-token.service';
import { PasswordResetService } from './password-reset.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    OwnershipGuard,
    RolesGuard,
    RefreshTokenService,
    RefreshTokenGuard,
    PasswordResetService,
  ],
  exports: [AuthService, JwtModule, JwtAuthGuard, OwnershipGuard, RolesGuard],
  imports: [
    ConfigModule,
    MailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => jwtConfig(configService),
    }),
  ],
})
export class AuthModule {}
