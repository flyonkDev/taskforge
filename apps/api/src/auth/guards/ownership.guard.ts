import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';
import { JwtPayload } from '../types/jwt-payload';
import { Task } from '@prisma/client';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
  task?: Task;
};

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const taskId = +request.params['id'];
    const userId = request.user.sub; // установлен JwtAuthGuard'ом

    if (!taskId || isNaN(taskId)) {
      throw new NotFoundException('Task not found');
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You do not own this resource');
    }

    request.task = task;

    return true;
  }
}
