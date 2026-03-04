import { GetTasksDto } from '../dto/get-tasks.dto';
import { Prisma } from '@prisma/client';

const ALLOWED_SORTING = ['title', 'status', 'createdAt'] as const;
type SortField = (typeof ALLOWED_SORTING)[number];

export function buildTaskOrder(
  query: GetTasksDto,
): Prisma.TaskOrderByWithRelationInput {
  const { order = 'desc', sortBy = 'createdAt' } = query;

  let sort: SortField = 'createdAt';

  if (sortBy && ALLOWED_SORTING.includes(sortBy as SortField)) {
    sort = sortBy as SortField;
  }

  const orderBy = {
    [sort]: order,
  };

  return orderBy;
}
