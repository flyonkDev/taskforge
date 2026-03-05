import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../common/prisma/utils';

import { buildTaskWhere } from './query-builders/task-where.builder';
import { buildTaskPagination } from './query-builders/task-pagination.builder';
import { buildTaskOrder } from './query-builders/task-order.builder';

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
    const { createdBefore, createdAfter, page = 1, limit = 20 } = query;

    const { skip, take } = buildTaskPagination(query);

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

    const where = buildTaskWhere(query);
    const orderBy = buildTaskOrder(query);

    const [total, tasks] = await this.prisma.$transaction([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        orderBy,
        skip,
        take,
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

  async incrementViewById(id: number) {
    try {
      return await this.prisma.task.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    } catch (e: unknown) {
      throw mapPrismaError(e);
    }
  }

  async completeTaskById(id: number) {
    try {
      const tasks = await this.prisma.task.updateMany({
        where: {
          id,
          status: { not: 'DONE' },
        },
        data: {
          status: 'DONE',
        },
      });

      if (tasks.count === 0) {
        throw new ConflictException('Task already complete');
      }

      return { success: true };
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
