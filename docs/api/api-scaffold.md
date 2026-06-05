# API scaffold (Day 12)

Fastify HTTP entry in `apps/api`. This document describes the folder layout, plugins, and operational endpoints for local dev and Kubernetes/Docker probes.

## Folder structure

```
apps/api/src/
├── app.ts              # buildApp() — registers plugins and modules
├── server.ts           # listen, PORT/HOST, graceful shutdown
├── index.ts            # bootstrap → startServer()
├── lib/                # cross-cutting helpers (logger, api-error, cookies)
├── modules/
│   ├── auth/           # Better Auth config, session, brokerage routes
│   ├── tenants/        # GET /v1/organization/me
│   ├── test-items/     # RLS demo routes (/v1/test-items)
│   ├── health/         # GET /health, GET /ready
│   ├── audit/          # GET /v1/audit-logs (owner/manager, paginated)
│   └── properties/     # CRUD /v1/properties (Day 17)
└── plugins/
    ├── auth.ts         # Better Auth + brokerage registration
    ├── zod-validator.ts
    ├── error-handler.ts
    ├── require-member-role.ts  # memberRole decorator + permission hooks
    ├── security.ts     # Helmet
    └── tenant-context.ts
```

## Plugins (registration order)

| Plugin | Role |
| ------ | ---- |
| `zod-validator` | Zod `validatorCompiler` / `serializerCompiler` for schema-driven routes |
| `error-handler` | Global `{ error, message }` JSON responses |
| `@fastify/cors` | Trusted origins (dashboard + API) |
| `security` | Helmet security headers |
| `auth` | Better Auth `app.all("/api/auth/*")` + brokerage routes (skippable in tests) |
| `tenant-context` | Session + `tenantId` for `/v1/*` only |
| `member-role` | `request.memberRole` decorator (registered once in `app.ts`) |

## Day 13 — Audit logs

| Endpoint | Method | Auth | RBAC |
| -------- | ------ | ---- | ---- |
| `/v1/audit-logs` | GET | Session cookie (or test mock) | `audit:read` (owner, manager) |

Query params: `limit` (default 20, max 100), `cursor` (optional, `createdAt\|id` from previous page).

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "actorId": "user-id",
      "action": "organization.created",
      "entityType": "organization",
      "entityId": "uuid",
      "metadata": {},
      "ip": "127.0.0.1",
      "createdAt": "2026-06-04T12:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

Writes use `logAuditEvent` from `@propai/db` inside `runInTenantContext`. Hooks: brokerage sign-up, test-item create, invite, accept invitation.

**ADR:** [003-audit-logs.md](../adr/003-audit-logs.md) · **Postman:** folder “Day 13 — Audit logs” in `propai-api.postman_collection.json`.

## Day 17 — Properties

Module: `apps/api/src/modules/properties/` (`index.ts`, `routes.ts`). Shared Zod contracts in `@propai/shared` (`createPropertySchema`, `propertyListQuerySchema`, etc.).

| Endpoint | Method | Auth | RBAC |
| -------- | ------ | ---- | ---- |
| `/v1/properties` | POST | Session cookie | `properties:write` (owner, manager, agent) |
| `/v1/properties` | GET | Session cookie | `properties:write`; agent scope on list |
| `/v1/properties/:id` | GET | Session cookie | `properties:write`; agent scope |
| `/v1/properties/:id` | PATCH | Session cookie | `properties:write`; agent scope |
| `/v1/properties/:id` | DELETE | Session cookie | `properties:write`; soft delete |

### RBAC matrix (v1)

| Role | List / read | Create | Update | Delete |
| ---- | ----------- | ------ | ------ | ------ |
| owner | All in tenant | Yes | All | All |
| manager | All in tenant | Yes | All | All |
| agent | `createdBy = self` only | Yes (sets self as creator) | Own only | Own only |
| viewer | 403 | 403 | 403 | 403 |

Agent scope uses `created_by === session.user.id` (no `assigned_to` column yet). Cross-tenant or out-of-scope access returns **404** (not 403) to avoid leaking existence.

### List query params

| Param | Type | Notes |
| ----- | ---- | ----- |
| `limit` | int 1–100 | default `20` |
| `cursor` | string | `ISO8601\|uuid` from previous `nextCursor` |
| `status` | enum | `draft`, `active`, `under_contract`, `sold`, `rented` |
| `type` | enum | `single_family`, `condo`, `townhouse`, `multi_family` |
| `city` | string | exact match (case-insensitive) |
| `state` | string | 2-letter US code |
| `minPriceUsdCents` | int | inclusive minimum |
| `maxPriceUsdCents` | int | inclusive maximum |

Default lists exclude soft-deleted rows (`softDeletedAt IS NULL`).

### Example responses

**Create (201):**

```json
{
  "property": {
    "id": "uuid",
    "tenantId": "uuid",
    "title": "Austin Ranch Home",
    "type": "single_family",
    "status": "active",
    "priceUsdCents": 45000000,
    "rentOrSale": "sale",
    "bedrooms": 3,
    "bathrooms": "2.5",
    "sqFt": 2100,
    "createdBy": "user-id",
    "createdAt": "2026-06-05T12:00:00.000Z",
    "updatedAt": "2026-06-05T12:00:00.000Z",
    "softDeletedAt": null
  }
}
```

**List (200):**

```json
{
  "items": [],
  "nextCursor": null
}
```

Audit actions: `property.created`, `property.updated`, `property.deleted`.

**Collections:** folder “Day 17 — Properties” in `propai-api.postman_collection.json` and `propai-api.insomnia.json`.

### Manual RBAC verification

1. Owner sign-up → POST property → appears in GET list.
2. Owner invites agent → agent creates listing → manager GET list shows both; each agent sees only own rows.
3. Agent B GET/PATCH another agent’s id → `404`.
4. Invite viewer → GET `/v1/properties` → `403`.
5. DELETE property → no longer in GET list.

## `/health` vs `/ready`

| Endpoint | Purpose | Auth | Depends on |
| -------- | ------- | ---- | ---------- |
| **`GET /health`** | **Liveness** — process is up | No | Nothing |
| **`GET /ready`** | **Readiness** — can serve traffic | No | PostgreSQL (`SELECT 1`) |

- Use **`/health`** for a simple alive check (always `200` when the server runs).
- Use **`/ready`** before routing traffic or after deploy: returns `200` only when Postgres answers; `503` when the DB is down.

### Example responses

**Liveness (always when server is up):**

```bash
curl -s http://localhost:3333/health
```

```json
{
  "status": "ok",
  "app": "PropAI OS",
  "tagline": "AI-powered Real Estate Operating System for US brokerages"
}
```

**Readiness (DB up):**

```bash
curl -s http://localhost:3333/ready
```

```json
{ "status": "ok" }
```

**Readiness (DB down):**

```json
{
  "status": "degraded",
  "checks": { "database": "down" }
}
```

## Kubernetes / Docker probe commands

Copy-paste for manifests (adjust host/port in production):

```yaml
# Liveness — restart if process hangs (does not check DB)
livenessProbe:
  httpGet:
    path: /health
    port: 3333
  initialDelaySeconds: 5
  periodSeconds: 10

# Readiness — remove from load balancer when DB unavailable
readinessProbe:
  httpGet:
    path: /ready
    port: 3333
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

Docker Compose healthcheck (API service example):

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3333/ready"]
  interval: 10s
  timeout: 5s
  retries: 3
  start_period: 15s
```

## Local validation (Day 12–17 checklist)

```bash
pnpm docker:up
pnpm db:migrate
pnpm test:api
pnpm db:rls-test    # test_items + audit_logs + properties RLS
pnpm --filter @propai/api dev
```

Another terminal:

```bash
curl -s http://localhost:3333/health
curl -s http://localhost:3333/ready
pnpm auth:poc   # optional Day 11 regression
```

## Related docs

- [dev-setup.md](../dev-setup.md) — install, env, scripts
- [auth-flow.md](./auth-flow.md) — Day 10–11 auth POC
- [architecture.md](../architecture.md) — product architecture + API pointer
