import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { RefreshTokenService } from '../refresh-token.service';

type RefreshRequest = Request<
  Record<string, unknown>,
  unknown,
  { refreshToken?: string }
> & {
  refreshToken?: string;
  refreshUserId?: number;
};

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RefreshRequest>();
    const token = request.body?.refreshToken;

    if (!token) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const userId = await this.refreshTokenService.validate(token);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // кэшируем на request для использования в контроллере/сервисе
    request.refreshToken = token;
    request.refreshUserId = userId;

    return true;
  }
}
