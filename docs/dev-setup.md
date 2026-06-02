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
