import {
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  MinLength,
} from 'class-validator';

import { TaskStatus } from '../types/tasks.status.enum';

export class CreateTaskDto {
  @IsNumber()
  @Min(1)
  userId: number;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
