import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../config/jwt.config';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, OwnershipGuard, RolesGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard, OwnershipGuard, RolesGuard],
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => jwtConfig(configService),
    }),
  ],
})
export class AuthModule {}
