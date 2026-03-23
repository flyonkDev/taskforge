import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });
if (!process.env.DATABASE_URL) {
  loadEnv({ path: resolve(process.cwd(), 'apps/api/.env'), quiet: true });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000);
}

bootstrap();
