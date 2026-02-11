# RN + Web Platform Monorepo

Production-grade starter monorepo for:
- `apps/mobile` (Expo React Native)
- `apps/web` (Next.js)
- `apps/api` (Fastify)
- `packages/shared` (schemas + types)
- `packages/logger` (structured JSON logger)
- `packages/db` (Prisma + PostgreSQL)

## Architecture (concise)

```
apps/
  api/      Fastify todo API + validation + auth guard + tests/smoke
  web/      Next.js UI + API proxy routes + Playwright smoke
  mobile/   Expo app using shared backend + logic smoke
packages/
  shared/   Zod request/response/error schemas
  db/       Prisma client + migrations/seed
  logger/   Pino logger config
```

## Environment variables

Copy `.env.example` to `.env` and edit locally (never commit `.env`).

Required:
- `DATABASE_URL` – PostgreSQL connection string

Optional but recommended:
- `API_BASE_URL` (default `http://127.0.0.1:3001`) for web/mobile proxying
- `API_WRITE_TOKEN` (if set, mutating API routes require `x-api-key` header)
- `EXPO_PUBLIC_API_BASE_URL` for mobile app runtime (falls back to `API_BASE_URL`)
- `EXPO_PUBLIC_API_WRITE_TOKEN` for mobile writes when API token is enabled

## Setup

```bash
pnpm install
docker compose up -d postgres
pnpm --filter @packages/db prisma:generate
pnpm --filter @packages/db prisma:migrate
pnpm --filter @packages/db prisma:seed
```

## Development

Run all apps together:
```bash
pnpm dev
```

Or run separately:
```bash
pnpm --filter @apps/api dev
pnpm --filter @apps/web dev
pnpm --filter @apps/mobile dev
```

## API behavior highlights

- `GET /health` => liveness + `requestId`
- `GET /ready` => DB readiness
- Todo routes have request + response validation.
- Error payloads are typed and include `requestId`:
  - `400 invalid_request`
  - `401 unauthorized`
  - `404 not_found`
  - `409 conflict`
  - `500 internal_error`
- Mutating routes (`POST/PATCH/DELETE /api/todos...`) require `x-api-key` only when `API_WRITE_TOKEN` is configured.

## Verification commands

```bash
pnpm -w lint
pnpm -w typecheck
pnpm -w test
pnpm -w smoke
```

Smoke target is designed to stay within ~2–3 minutes on a warm local machine.

## Troubleshooting

- **`/ready` fails**: verify postgres container health and `DATABASE_URL`.
- **Prisma client errors**: run `pnpm --filter @packages/db prisma:generate`.
- **401 on writes**: set matching `x-api-key` header or unset `API_WRITE_TOKEN` for local dev.
- **Web smoke failures**: ensure ports `3000` (web) + `3001` (api) are free.
- **Mobile can’t reach API on real device**: use LAN-accessible `EXPO_PUBLIC_API_BASE_URL` instead of localhost.

## Verification checklist

- [ ] API starts and `/health` + `/ready` respond.
- [ ] Web app loads todos, create/toggle/delete works.
- [ ] Mobile app reads/creates/toggles/deletes against same backend.
- [ ] `pnpm -w typecheck` passes.
- [ ] `pnpm -w smoke` passes.
- [ ] No secrets committed (`.env` ignored).
