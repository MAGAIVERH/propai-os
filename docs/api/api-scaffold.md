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
│   └── audit/          # GET /v1/audit-logs (owner/manager, paginated)
└── plugins/
    ├── auth.ts         # Better Auth + brokerage registration
    ├── zod-validator.ts
    ├── error-handler.ts
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

## Local validation (Day 12–13 checklist)

```bash
pnpm docker:up
pnpm db:migrate
pnpm test:api
pnpm db:rls-test    # test_items + audit_logs RLS
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
