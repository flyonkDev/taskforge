import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

function isPrismaUniqueError(e: unknown): e is { code: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    typeof (e as any).code === 'string'
  );
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: { email: dto.email, name: dto.name },
      });
    } catch (e: unknown) {
      if (isPrismaUniqueError(e) && e.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw e;
    }
  }
}
