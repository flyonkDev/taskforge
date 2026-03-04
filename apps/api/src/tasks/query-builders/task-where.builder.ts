import { Prisma } from '@prisma/client';
import { GetTasksDto } from '../dto/get-tasks.dto';

export function buildTaskWhere(query: GetTasksDto): Prisma.TaskWhereInput {
  const { userId, status, search, createdBefore, createdAfter } = query;
  const andConditions: Prisma.TaskWhereInput[] = [];

  const normalizedSearch = search ? search.trim() : null;
  const afterDate = createdAfter ? new Date(createdAfter) : null;
  const beforeDate = createdBefore ? new Date(createdBefore) : null;

  if (userId) andConditions.push({ userId });
  if (status) andConditions.push({ status });

  // Date Range
  if (beforeDate || afterDate) {
    andConditions.push({
      createdAt: {
        ...(afterDate && { gte: afterDate }),
        ...(beforeDate && { lte: beforeDate }),
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

  if (andConditions.length === 0) {
    return {};
  }

  return { AND: andConditions };
}
