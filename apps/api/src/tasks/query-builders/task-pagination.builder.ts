import { GetTasksDto } from '../dto/get-tasks.dto';

export function buildTaskPagination(query: GetTasksDto) {
  const { page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}
