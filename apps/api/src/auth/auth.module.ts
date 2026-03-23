import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
  imports: [
    JwtModule.register({
      secret: 'dev-secret',
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
})
export class AuthModule {}
