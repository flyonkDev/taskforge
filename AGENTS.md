# AGENTS.md

## Project Context
- Monorepo: `taskforge`
- Backend app: `apps/api` (NestJS + Prisma + PostgreSQL)
- Main goal now: stable Prisma runtime and working auth flow (`/auth/register`, `/auth/login`)

## Run Commands
- Install deps (workspace root): `npm install`
- Start backend dev server: `npm run start:dev -w apps/api`
- Prisma sync (from `apps/api`): `npx prisma db push`
- Prisma Studio (from `apps/api`): `npx prisma studio`

## Environment Rules
- Source of truth for DB connection: `apps/api/.env`
- `DATABASE_URL` must target local Postgres `taskforge_dev` schema `public`
- If Prisma CLI works but Nest fails, first check runtime env loading and process cwd

## Debug Checklist
- `EADDRINUSE:3000` means old process is still alive; free port 3000 before restart
- If `prisma db push` throws Windows `EPERM` on engine rename, stop running Node/Nest processes and retry
- Keep only one active backend dev server

## Scope Guardrails
- Do not edit/delete migration history unless explicitly requested
- Avoid touching unrelated frontend/package files during backend auth/prisma fixes
- Keep changes minimal and verify `/auth/register` after Prisma-related edits
