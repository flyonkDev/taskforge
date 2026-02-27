import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../common/prisma/utils';

import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';

const userPublicSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: { email: dto.email, name: dto.name },
      });
    } catch (e: unknown) {
      throw mapPrismaError(e);
    }
  }

  async findAll(query: GetUsersQueryDto) {
    const page = Number(query.page) || 1;
    if (page < 1 || page > 100) {
      throw new BadRequestException('Invalid page number');
    }

    const limit = Number(query.limit) || 10;
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid limit');
    }

    const skip = (page - 1) * limit;
    const userId = Number(query.userId) || undefined;
    const where = userId ? { id: userId } : undefined;

    const total = await this.prisma.user.count({
      where,
    });

    const pages = Math.max(1, Math.ceil(total / limit));

    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: userPublicSelect,
      where,
    });

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        pages,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
