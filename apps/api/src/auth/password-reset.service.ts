import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { randomBytes } from 'crypto';

@Injectable()
export class PasswordResetService {
  private readonly TOKEN_PREFIX = 'pwd-reset:';
  private readonly COOLDOWN_PREFIX = 'pwd-reset-cooldown:';
  private readonly TOKEN_TTL = 3600; // 1h
  private readonly COOLDOWN_TTL = 120; // 2min

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async generateToken(userId: number): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.set(
      `${this.TOKEN_PREFIX}${token}`,
      userId.toString(),
      'EX',
      this.TOKEN_TTL,
    );
    return token;
  }

  async validateToken(token: string): Promise<number | null> {
    const userId = await this.redis.get(`${this.TOKEN_PREFIX}${token}`);
    return userId ? parseInt(userId, 10) : null;
  }

  async consumeToken(token: string): Promise<void> {
    await this.redis.del(`${this.TOKEN_PREFIX}${token}`);
  }

  async canRequest(userId: number): Promise<boolean> {
    const exists = await this.redis.exists(`${this.COOLDOWN_PREFIX}${userId}`);
    return exists === 0;
  }

  async markRequested(userId: number): Promise<void> {
    await this.redis.set(
      `${this.COOLDOWN_PREFIX}${userId}`,
      '1',
      'EX',
      this.COOLDOWN_TTL,
    );
  }
}
