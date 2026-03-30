import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class RefreshTokenService {
  // TTL в секундах — 30 дней
  private readonly TTL = 30 * 24 * 60 * 60;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async generate(userId: number): Promise<string> {
    // генерируем cryptographically secure random token
    const token = randomBytes(40).toString('hex');
    // ключ: refresh:<token>, значение: userId как строка, TTL: 30 дней
    await this.redis.set(`refresh:${token}`, userId.toString(), 'EX', this.TTL);
    return token;
  }

  async validate(token: string): Promise<number | null> {
    const userId = await this.redis.get(`refresh:${token}`);
    if (!userId) return null;
    return parseInt(userId);
  }

  async revoke(token: string): Promise<void> {
    await this.redis.del(`refresh:${token}`);
  }

  async revokeAll(userId: number): Promise<void> {
    // scan + delete всех ключей конкретного пользователя
    // используем для reuse detection (компрометация токена)
    const keys = await this.redis.keys(`refresh:*`);
    for (const key of keys) {
      const val = await this.redis.get(key);
      if (val === userId.toString()) {
        await this.redis.del(key);
      }
    }
  }
}
