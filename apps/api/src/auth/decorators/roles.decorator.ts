import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// SetMetadata — это хелпер из NestJS, который под капотом вызывает Reflect.defineMetadata.
// Первый аргумент — ключ (мы назначаем его константой ROLES_KEY чтобы не делать опечаток),
// второй — значение, которое будет сохранено
// Мы экспортируем ROLES_KEY отдельно —
// RolesGuard будет импортировать именно её для чтения метаданных
