import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { TasksService } from '../tasks/tasks.service';

import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tasksService: TasksService,
  ) {}

  @Get()
  getUsersList(@Query() query: GetUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':id')
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get(':id/tasks')
  getTasksList(@Param('id', ParseIntPipe) userId: number) {
    return this.tasksService.getUserTasksById(userId);
  }
}
