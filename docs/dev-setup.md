# Development setup (Day 2)

## Prerequisites

| Tool    | Version            | Check            |
| ------- | ------------------ | ---------------- |
| Node.js | 20 LTS (22 OK)     | `node -v`        |
| pnpm    | 9+                 | `pnpm -v`        |
| Docker  | Desktop running    | `docker -v`      |
| GitHub  | `gh` authenticated | `gh auth status` |

Verify Docker: `docker run --rm hello-world`

## Install

```bash
pnpm install
cp .env.example .env
pnpm docker:up    # PostgreSQL + Redis (local)
```

Local database URL (default in `.env.example`):

`postgresql://propai:propai@localhost:5432/propai`

## Scripts

| Command             | Description                                       |
| ------------------- | ------------------------------------------------- |
| `pnpm dev`          | Turbo — Next.js dashboard (`apps/web`, port 3000) |
| `pnpm docker:up`    | Start Postgres + Redis via Docker Compose         |
| `pnpm docker:down`  | Stop local containers                             |
| `pnpm db:generate`  | Generate SQL migrations from Drizzle schema       |
| `pnpm db:migrate`   | Apply migrations (`DATABASE_URL` in root `.env`)  |
| `pnpm db:studio`    | Open Drizzle Studio                               |
| `pnpm db:rls-test`  | Run RLS isolation POC (`propai_app` role)       |
| `pnpm db:seed-dev`    | Seed dev org + owner user + settings            |
| `pnpm test:api`       | API auth + RLS integration tests (Vitest)       |
| `pnpm test:shared`    | Shared package unit tests (`hasPermission`, roles) |
| `pnpm auth:poc`       | Day 11 auth smoke (dual org isolation + invite) — needs Postgres + migrations |
| `pnpm build`        | Production build                                  |
| `pnpm lint`         | ESLint (all workspace packages)                   |
| `pnpm typecheck`    | TypeScript strict check (Turbo)                   |
| `pnpm lint:fix`     | ESLint with auto-fix                              |
| `pnpm format`       | Prettier write                                    |
| `pnpm format:check` | Prettier check (CI)                               |

## Editor

Recommended extensions (see `.vscode/extensions.json`):

- ESLint
- Prettier
- Tailwind CSS IntelliSense

Format on save is enabled in `.vscode/settings.json`.

## UI stack

- **shadcn/ui** (base-nova) — components in `src/components/ui`
- **Dark mode only** — `class="dark"` on `<html>`, `forcedTheme="dark"`
- **Toasts** — Sonner via `@/components/ui/sonner`
- **Validation** — Zod
- **Charts** — Recharts (for dashboard modules)

Add components:

```bash
pnpm dlx shadcn@latest add <component> -y
```

## Cloud accounts (manual)

Create projects and copy keys into `.env` (never commit `.env`):

- Vercel, Neon, Upstash, R2/S3, Resend, Stripe (test), OpenAI/Anthropic, Sentry

See `.env.example` for variable names.

## API auth (Day 10)

Start the API:

```bash
pnpm --filter @propai/api dev
```

Auth endpoints (Better Auth + brokerage sign-up):

| Endpoint | Method | Purpose |
| -------- | ------ | ------- |
| `/api/auth/brokerage-sign-up` | POST | Create user + org + owner + settings |
| `/api/auth/sign-in/email` | POST | Email/password login |
| `/api/auth/get-session` | GET | Current session + `activeOrganizationId` |
| `/v1/test-items` | GET | Protected route (requires session cookie) |

Postman collection: `docs/api/propai-api.postman_collection.json`  
Step-by-step: `docs/api/auth-flow.md`

Required env: `BETTER_AUTH_URL=http://localhost:3333`, `BETTER_AUTH_SECRET` (32+ chars).

## API health & readiness (Day 12)

| Endpoint   | Method | Purpose |
| ---------- | ------ | ------- |
| `/health`  | GET    | Liveness — always `{ "status": "ok" }` (+ app metadata) |
| `/ready`   | GET    | Readiness — `200` if Postgres answers `SELECT 1`, else `503` |

```bash
pnpm docker:up
pnpm db:migrate
pnpm --filter @propai/api dev

curl -s http://localhost:3333/health
curl -s http://localhost:3333/ready
```

If Postgres is stopped (`pnpm docker:down`), `/ready` returns `503` with:

```json
{ "status": "degraded", "checks": { "database": "down" } }
```

### Day 11 quick re-validation

```bash
pnpm docker:up
pnpm db:migrate
pnpm auth:poc          # PASS/FAIL smoke (no Vitest runner)
pnpm test:api          # full integration suite
pnpm test:shared       # role permission unit tests
```

Sign-off template: `docs/AUTH-POC-FEEDBACK.md` · Manual steps: `docs/api/auth-flow.md` (Day 11).
