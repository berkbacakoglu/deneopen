# RN + Web Platform Monorepo

Production-grade starter monorepo for:
- `apps/mobile` (Expo React Native)
- `apps/web` (Next.js)
- `apps/api` (Fastify)
- `packages/shared` (types/schemas)
- `packages/logger` (structured JSON logger)
- `packages/db` (Prisma + PostgreSQL)

## Assumptions
- Node 22+, pnpm 10+, Docker available.
- PostgreSQL runs locally via docker-compose for development.

## Environment
Copy `.env.example` to `.env` and set values locally.
Do not commit `.env`.

## Setup (run in order)
```bash
pnpm install
docker compose up -d postgres
pnpm --filter @packages/db prisma:generate
pnpm --filter @packages/db prisma:migrate
pnpm --filter @packages/db prisma:seed
```

## Run
```bash
pnpm --filter @apps/api dev
pnpm --filter @apps/web dev
pnpm --filter @apps/mobile dev
```

## Health/Readiness
- `GET /health` => liveness
- `GET /ready` => DB connectivity readiness

## Logging spec
- JSON logs via pino.
- Redaction keys include: authorization, cookie, set-cookie, password, token, apiKey, secret.
- Request lifecycle logs include requestId, method, route, statusCode, latencyMs.
- Server logs keep error stack; client receives sanitized error payload with requestId.

## Tests
```bash
pnpm -w lint
pnpm -w typecheck
pnpm -w test
pnpm -w smoke
```

Smoke target: under 2–3 minutes in CI.

## Troubleshooting
- If `/ready` fails, verify postgres container health and `DATABASE_URL`.
- If Prisma client errors, run `pnpm --filter @packages/db prisma:generate`.
- If Playwright smoke fails, ensure web app booted on port 3000.
