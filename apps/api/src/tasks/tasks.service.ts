import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../common/prisma/utils';

import { TaskStatus } from './types/tasks.status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksDto } from './dto/get-tasks.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto) {
    const payload = {
      ...dto,
      status: dto.status ?? TaskStatus.TODO,
    };

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.prisma.task.create({ data: payload });
    } catch (e: unknown) {
      throw mapPrismaError(e);
    }
  }

  async getList(query: GetTasksDto) {
    const {
      userId,
      status,
      search,
      createdBefore,
      createdAfter,
      page = 1,
      limit = 20,
    } = query;

    if (page < 1 || page > 300) {
      throw new BadRequestException('Invalid page number');
    }

    if (limit < 1 || limit > 1000) {
      throw new BadRequestException('Invalid limit');
    }

    const afterDate = createdAfter ? new Date(createdAfter) : null;
    const beforeDate = createdBefore ? new Date(createdBefore) : null;

    if (afterDate && beforeDate && afterDate > beforeDate) {
      throw new BadRequestException('Invalid date range');
    }

    const normalizedSearch = search ? search.trim() : null;

    const where: Prisma.TaskWhereInput = {};
    const andConditions: Prisma.TaskWhereInput[] = [];

    if (userId) andConditions.push({ userId });
    if (status) andConditions.push({ status });

    // Date Range
    if (beforeDate || afterDate) {
      andConditions.push({
        createdAt: {
          ...(afterDate && { gte: new Date(afterDate) }),
          ...(beforeDate && { lte: new Date(beforeDate) }),
        },
      });
    }

    if (normalizedSearch && normalizedSearch.length > 0) {
      andConditions.push({
        OR: [
          {
            title: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const skip = (page - 1) * limit;

    const ALLOWED_SORTING = ['title', 'status', 'createdAt'] as const;
    type SortField = (typeof ALLOWED_SORTING)[number];

    let sortBy: SortField = 'createdAt';

    if (query.sortBy && ALLOWED_SORTING.includes(query.sortBy as SortField)) {
      sortBy = query.sortBy as SortField;
    }

    const order = query.order === 'asc' ? 'asc' : 'desc';

    const orderBy = {
      [sortBy]: order,
    };

    const [total, tasks] = await this.prisma.$transaction([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));

    return {
      data: tasks,
      meta: {
        page,
        limit,
        total,
        pages,
      },
    };
  }

  async getUserTasksById(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.prisma.task.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e: unknown) {
      throw mapPrismaError(e);
    }
  }

  async updateTaskById(id: number, dto: UpdateTaskDto) {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const hasTitle = dto.title !== undefined;
      const hasStatus = dto.status !== undefined;

      if (!hasTitle && !hasStatus) {
        throw new BadRequestException('No data provided');
      }

      return await this.prisma.task.update({
        where: { id },
        data: dto,
      });
    } catch (e: unknown) {
      throw mapPrismaError(e);
    }
  }
}
