import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksDto } from './dto/get-tasks.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getTasksList(@Query() query: GetTasksDto) {
    return this.tasksService.getList(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-tasks')
  getMyTasks(@CurrentUser() user: JwtPayload) {
    return this.tasksService.getUserTasksById(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createTask(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaskDto) {
    return this.tasksService.create({
      ...dto,
      userId: user.sub,
    });
  }

  @Post(':id/view')
  incrementView(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.incrementViewById(id);
  }

  @Post(':id/complete')
  completeTask(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.completeTaskById(id);
  }

  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTaskById(id, dto);
  }
}
