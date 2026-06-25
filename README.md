# PropAI OS

**An AI-powered Real Estate Operating System for US brokerages.**

**Foundation v0.1.0** — [Sign-off](docs/FOUNDATION-SIGNOFF.md) · [Checklist](docs/BACKEND-FOUNDATION-CHECKLIST.md) · [Release](docs/releases/foundation-v0.1.0.md) · tag `foundation-v0.1.0`

---

## Problem

US brokerages run on fragmented tools: a CRM here, a listing site there, spreadsheets for pipeline, and email for scheduling. Agents context-switch constantly; managers lack a single view of leads, listings, and performance; tenant data isolation is often enforced only in application code. Public marketplaces rarely feed the CRM in real time, and search stays keyword-based while buyers think in natural language. The result is slower deals, duplicated work, and weak visibility from first touch to close.

## Solution

PropAI OS is an AI-powered Real Estate Operating System built for US brokerages and their teams. It unifies multi-tenant CRM, deal pipeline, and a property marketplace in one platform, with semantic search that understands natural-language intent and analytics that turn activity into actionable insight. From lead capture to close, PropAI OS gives agents, brokers, and operators a single workspace to run the business—faster decisions, cleaner workflows, and intelligence embedded where work actually happens.

**Product scope:** SaaS dashboard (brokerages) · public marketplace (SEO) · API + workers · premium landing page.

**Language & market:** English only (en-US), built for the US real estate market.

---

## Live demo
> Live demo coming in Phase 2 (Properties UI). Foundation v0.1 ships multi-tenancy, RLS, auth, and AI feature flags.

Demo credentials will be documented here once staging is deployed.

---

## Architecture

High-level system view (target monorepo):

```mermaid
flowchart TB
  subgraph clients [Clients]
    Web[apps/web — Brokerage dashboard]
    Marketplace[apps/marketplace — Public SEO marketplace]
    Landing[Landing / marketing]
  end

  subgraph api [apps/api — Fastify]
    REST[REST API]
    WS[WebSocket — real-time CRM]
    Workers[BullMQ workers]
  end

  subgraph packages [packages]
    Shared[shared — Zod contracts]
    DB[db — Drizzle schema + RLS]
    UI[ui — shadcn components]
    Config[config — ESLint, TS, Tailwind]
  end

  subgraph infra [Infrastructure]
    Neon[(PostgreSQL + pgvector — Neon)]
    Redis[(Redis — Upstash)]
    R2[Object storage — R2 / S3]
    AI[Vercel AI SDK]
    Auth[Better Auth — Organizations]
  end

  Web --> REST
  Web --> WS
  Marketplace --> REST
  Landing --> Web

  REST --> Shared
  REST --> DB
  REST --> Auth
  Workers --> Redis
  Workers --> AI
  Workers --> DB
  DB --> Neon
  REST --> R2
```

### Target monorepo structure

```
propai-os/
├── apps/
│   ├── api/              # Fastify — REST + WebSocket + worker entry
│   ├── web/              # Next.js — SaaS dashboard (brokerages)
│   └── marketplace/      # Next.js — public property search (SEO/SSR)
├── packages/
│   ├── db/               # Drizzle schema, migrations, RLS policies
│   ├── shared/           # Zod contracts, enums, constants, helpers
│   ├── ui/               # Shared shadcn-based components
│   └── config/           # ESLint, TSConfig, Tailwind presets
├── docs/
│   ├── architecture.md
│   ├── adr/              # Architecture Decision Records
│   ├── demo-script.md
│   └── legal/            # Privacy, Terms, Fair Housing
├── docker/
├── docker-compose.yml
├── .github/workflows/
└── README.md
```

> **Note:** Monorepo scaffold is active. `packages/ui` and full Drizzle/RLS in `packages/db` ship in Phase 1 (Days 6+).

---

## Tech stack

| Layer         | Technology                                                         |
| ------------- | ------------------------------------------------------------------ |
| Monorepo      | Turborepo, pnpm workspaces                                         |
| API           | Fastify, Zod validation, WebSocket                                 |
| Frontend      | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui                |
| UI polish     | Inspira UI, GSAP, Lenis                                            |
| Database      | PostgreSQL (Neon), Drizzle ORM, Row-Level Security (RLS), pgvector |
| Auth          | Better Auth (Organizations)                                        |
| Jobs & cache  | BullMQ, Redis (Upstash)                                            |
| AI            | Vercel AI SDK (vision, embeddings, lead scoring)                   |
| Storage       | Cloudflare R2 or AWS S3 (presigned uploads)                        |
| Email         | Resend                                                             |
| Billing       | Stripe                                                             |
| Observability | Sentry                                                             |
| DevOps        | Docker, GitHub Actions, Vercel                                     |
| Testing       | Vitest, Playwright                                                 |

---

## Core capabilities (roadmap)

- **Multi-tenant CRM** — organizations, roles (owner, manager, agent, viewer), audit log
- **Pipeline** — Kanban stages, real-time updates via WebSocket
- **Properties** — US fields (sq ft, USD, state/ZIP), photos, map, AI-assisted listing generation
- **Marketplace** — SSR property search, semantic query, lead capture into CRM
- **AI** — photo analysis, pgvector semantic search, lead scoring, price estimates
- **Analytics & billing** — funnel metrics, CSV export, Stripe Free / Pro plans

---

## Monorepo structure

| Path | Package | Description |
| ---- | ------- | ----------- |
| `apps/web` | `@propai/web` | Brokerage SaaS dashboard (Next.js) |
| `apps/marketplace` | `@propai/marketplace` | Public property search (Next.js, SEO) |
| `apps/api` | `@propai/api` | REST API entry (Fastify) — WebSocket/workers later |
| `packages/shared` | `@propai/shared` | Zod contracts, constants, shared types |
| `packages/db` | `@propai/db` | Drizzle schema, migrations, RLS (Phase 1) |
| `packages/config` | `@propai/config` | Shared TypeScript / tooling presets |

Managed with **pnpm workspaces** and **Turborepo**.

## What's included in v0.1 (Foundation)

Phase 1 backend freeze — multi-tenancy only (no Properties UI yet):

- **Row-Level Security** — `test_items` + `audit_logs`; `runInTenantContext`; `propai_app` DB role
- **Auth** — Better Auth organizations; brokerage sign-up, invite, session; [Auth POC GO](docs/AUTH-POC-FEEDBACK.md)
- **Audit** — tenant-scoped `audit_logs`; `GET /v1/audit-logs` (owner/manager)
- **Health** — `GET /health` (liveness), `GET /ready` (Postgres probe)
- **Local dev** — Docker Compose, `pnpm setup:local`, `pnpm dev`, `pnpm dev:smoke`

Details: [docs/releases/foundation-v0.1.0.md](./docs/releases/foundation-v0.1.0.md) · [docs/architecture.md](./docs/architecture.md)

---

## Getting started

**Prerequisites:** Node 20 LTS, pnpm 9+, Docker Desktop (Windows or macOS).

**Start here:** [docs/LOCAL-DEV.md](./docs/LOCAL-DEV.md) — fresh clone, Docker, migrate, `pnpm dev`, smoke tests, troubleshooting.

```bash
git clone https://github.com/MAGAIVERH/propai-os.git
cd propai-os
pnpm install
pnpm setup:local       # .env + Docker + migrations
# Set BETTER_AUTH_SECRET in .env (min 32 chars) if using auth
pnpm dev               # API :3333 + dashboard :3000
```

Verify (second terminal while `pnpm dev` is running):

```bash
curl -s http://localhost:3333/health
curl -s http://localhost:3333/ready    # expect HTTP 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
pnpm dev:smoke --spawn-api            # smoke without pnpm dev (spawns temp API)
# or: pnpm dev (terminal 1) + pnpm dev:smoke (terminal 2)
```

| Command | Apps |
| ------- | ---- |
| `pnpm dev` | API + dashboard (default — Turbo filters `@propai/api` + `@propai/web`) |
| `pnpm dev:all` | API + dashboard + marketplace (`:3001`) |
| `pnpm setup:local` | `.env` + `docker:up` + `db:migrate` |

Run a single app:

```bash
pnpm --filter @propai/web dev          # http://localhost:3000
pnpm --filter @propai/marketplace dev  # http://localhost:3001
pnpm --filter @propai/api dev          # http://localhost:3333
```

### Demo data

Seed a realistic US demo tenant (**Summit Realty Group**, Denver, CO) — owner,
agent, 6 listings, 12 leads across the pipeline, and scheduled visits:

```bash
pnpm db:seed     # requires Docker Postgres + pnpm db:migrate
```

Then sign in at http://localhost:3000 with the demo credentials. The default
password is **not** committed — override via env for anything shared:

```bash
DEMO_EMAIL=demo@propai.io DEMO_PASSWORD='your-strong-password' pnpm db:seed
```

Defaults (local only): `demo@propai.io` / `DemoPass123!` (owner) and
`john.martinez@summit-realty.demo` / `DemoPass123!` (agent). The seed is
idempotent — it skips if the demo tenant already exists. See
[docs/tasks/PHASE-7-DAY-73-MANUAL.md](./docs/tasks/PHASE-7-DAY-73-MANUAL.md).

Docker Compose optional API container: `docker compose --profile api up -d` (see `docker-compose.yml`).

Quality checks (also run in CI on every PR):

```bash
pnpm lint
pnpm typecheck
pnpm test:api    # requires Docker Postgres + pnpm db:migrate
```

See [docs/LOCAL-DEV.md](./docs/LOCAL-DEV.md) (onboarding) and [docs/dev-setup.md](./docs/dev-setup.md) (editor, cloud, auth tables).  
API scaffold (Day 12): [docs/api/api-scaffold.md](./docs/api/api-scaffold.md)

| App | Default URL |
| --- | ----------- |
| Dashboard (`apps/web`) | http://localhost:3000 |
| Marketplace (`apps/marketplace`) | http://localhost:3001 |
| API (`apps/api`) | http://localhost:3333 |

---

## AI features

PropAI OS ships four AI capabilities, each behind a feature flag so they can be enabled independently without affecting CI or demo environments that lack API keys.

| Feature | Flag | Model | Endpoint |
| ------- | ---- | ----- | -------- |
| Property image analysis | `ENABLE_AI_VISION` | Gemini Flash 2.0 | `POST /v1/ai/analyze-property-images` |
| Semantic property search | `ENABLE_SEMANTIC_SEARCH` | text-embedding-3-small | `GET /search/semantic` |
| Lead scoring | `ENABLE_AI_SCORING` | gpt-4o-mini | `POST /v1/ai/score-lead` |
| Price estimation | `ENABLE_AI_PRICING` | gpt-4o-mini | `POST /v1/ai/estimate-price` |

All flags default to `false`. When a flag is off, the API returns a deterministic mock response so the UI and tests work without real credentials.

### Enabling AI in local dev

```bash
# .env — add the keys for the features you want to test
GEMINI_API_KEY=...                # vision
OPENAI_API_KEY=...                # embeddings, scoring, pricing

ENABLE_AI_VISION=true             # async Gemini via BullMQ
ENABLE_SEMANTIC_SEARCH=true       # pgvector cosine search
ENABLE_AI_SCORING=true            # gpt-4o-mini lead scoring
ENABLE_AI_PRICING=true            # gpt-4o-mini price estimator
```

Redis (Upstash or local Docker) is required when `ENABLE_AI_VISION=true` or `ENABLE_SEMANTIC_SEARCH=true` (BullMQ queues). All four flags can run with local Docker (`docker compose up -d`).

### Cost summary

| Feature | Model | Est. cost per operation |
| ------- | ----- | ----------------------- |
| Image analysis (10 photos) | Gemini Flash 2.0 | ~$0.001 |
| Embedding (property publish) | text-embedding-3-small | ~$0.000004 |
| Semantic search query | text-embedding-3-small | ~$0.000002 |
| Lead scoring | gpt-4o-mini | ~$0.0001 |
| Price estimation | gpt-4o-mini | ~$0.0002 |

Rate limits: image analysis is capped at **10 analyses per tenant per hour** to prevent runaway costs.

See [ADR 006](docs/adr/006-ai-vision-listings.md) (vision) and [ADR 007](docs/adr/007-semantic-search-pgvector.md) (semantic search) for architecture and trade-off details.

---

## Documentation

| Document               | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `docs/LOCAL-DEV.md`    | **Fresh clone** — Docker, migrate, dev, smoke, troubleshooting |
| `docs/FOUNDATION-SIGNOFF.md` | **Executive summary** — what v0.1 proved / excluded |
| `docs/BACKEND-FOUNDATION-CHECKLIST.md` | **Phase 1 sign-off** — Days 6–15, pre-tag verification |
| `docs/releases/foundation-v0.1.0.md` | **Release notes** — tag `foundation-v0.1.0` |
| `docs/adr/README.md` | **ADR index** — 001 RLS, 002 identity, 003 audit, 006 AI vision, 007 semantic search |
| `docs/PHASE-2-PLAN.md` | **Properties** — Days 16–25 roadmap |
| `docs/REQUIREMENTS.md` | **v1 product scope** — flows, AI, fields, MVP lock      |
| `docs/architecture.md` | Actors, brokerage flow, **RLS diagrams** (Foundation v0.1) |
| `docs/api/api-scaffold.md` | Fastify layout, `/health` vs `/ready`, K8s probes   |
| `docs/adr/`            | Architecture Decision Records                           |
| `docs/legal/`          | [Privacy, Terms, Fair Housing](./docs/legal/) (draft)   |

---

## Public marketplace (Phase 5)

The public, SEO-first marketplace (`apps/marketplace`, port 3001) lets visitors
browse and convert into CRM leads — no auth required.

- **SSR listing grid** with URL-bound filters (`/properties?city=Austin&beds=2`) and cursor "Load more".
- **Detail pages** with a photo gallery, location map, `RealEstateListing` JSON-LD, and Open Graph/Twitter cards.
- **AI search** (`/search`) — describe a home in plain English; results ranked by a hybrid score (semantic 40% + price 20% + distance 20% + recency 20%, see [ADR 008](./docs/adr/008-hybrid-search-ranking.md)) with sort options. Degrades gracefully when the flag is off.
- **Clustered map** (`/properties/map`) with list ↔ map selection sync.
- **Lead capture** — `POST /public/leads` with IP rate limiting (Redis, fail-open), a honeypot, and a live `lead:created` push so the lead lands on the dashboard Kanban within seconds.
- **Fair Housing** disclaimer site-wide, `/privacy` + `/terms`, and a cookie notice.

**Performance — Redis listing cache (Day 53):** `GET /public/properties`
responses are cached for 5 minutes and tagged with an `X-Cache: HIT|MISS`
header; a cache `HIT` skips the DB round-trip entirely (single-digit ms vs the
live query) and is invalidated on any property create/update/delete. See
[docs/tasks/PHASE-5-DAY-53-MANUAL.md](./docs/tasks/PHASE-5-DAY-53-MANUAL.md) to
measure before/after.

Full sign-off: [docs/MARKETPLACE-CHECKLIST.md](./docs/MARKETPLACE-CHECKLIST.md).

---

## License

TBD.

---

## Status

**Foundation v0.1 (Phase 1)** — Multi-tenancy backend frozen: RLS, Better Auth orgs, Fastify API scaffold, audit logs, local Docker dev. Checklist: [docs/BACKEND-FOUNDATION-CHECKLIST.md](./docs/BACKEND-FOUNDATION-CHECKLIST.md). Next: [docs/PHASE-2-PLAN.md](./docs/PHASE-2-PLAN.md) (Properties). See [docs/architecture.md](./docs/architecture.md) for actors, RLS data plane, and brokerage flow.
