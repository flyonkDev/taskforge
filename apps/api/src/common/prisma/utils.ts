import { ConflictException } from '@nestjs/common';

function isPrismaErrorWithCode(e: unknown): e is { code: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    typeof e.code === 'string'
  );
}

export function mapPrismaError(e: unknown): Error {
  if (isPrismaErrorWithCode(e) && e.code === 'P2002') {
    return new ConflictException('Email already exists');
  }
  return e instanceof Error ? e : new Error('Unknown error');
}
