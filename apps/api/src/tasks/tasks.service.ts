import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapPrismaError } from '../common/prisma/utils';
import { CreateTaskDto, UpdateTaskDto, TaskStatus } from './dto/tasks.dto';

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
