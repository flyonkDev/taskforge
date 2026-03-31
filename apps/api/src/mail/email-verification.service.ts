import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const VERIFICATION_TTL = 60 * 60 * 24; // 1day
const RESEND_COOLDOWN = 60 * 2; // 2min

@Injectable()
export class EmailVerificationService {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  async generateToken(userId: number): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.set(`verify:${token}`, userId, 'EX', VERIFICATION_TTL);
    return token;
  }

  async validateToken(token: string): Promise<number | null> {
    const userId = await this.redis.get(`verify:${token}`);
    return userId ? parseInt(userId, 10) : null;
  }

  async consumeToken(token: string): Promise<void> {
    await this.redis.del(`verify:${token}`);
  }

  async canResend(userId: number): Promise<boolean> {
    const key = `verify-resend:${userId}`;
    const exists = await this.redis.get(key);
    return !exists;
  }

  async markResendSent(userId: number): Promise<void> {
    const key = `verify-resend:${userId}`;
    await this.redis.set(key, '1', 'EX', RESEND_COOLDOWN);
  }
}
