# PropAI OS — Architecture

Product architecture for the US brokerage SaaS platform. This document defines **who** uses the system and **how** a typical brokerage runs deals end to end. Technical stack details live in the root [README](../README.md).

---

## Actors

PropAI OS serves a multi-tenant B2B product (brokerages) plus a public marketplace (consumers). Five primary actors interact with the platform:

| Actor              | Scope                            | Primary goals                                                                                                                                                                                        |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Platform Admin** | Cross-tenant (PropAI operations) | Operate the SaaS: tenant health, support escalations, feature flags, compliance tooling, and incident response. Does not access brokerage deal data except under audited support flows.              |
| **Owner**          | Single brokerage (organization)  | Own the account: billing (Stripe), plan limits, invite/remove members, brokerage profile, integrations, and org-wide settings. Full visibility across CRM, pipeline, listings, and analytics.        |
| **Manager**        | Single brokerage                 | Run the team: assign and reassign leads, manage pipeline stages, approve listings, monitor agent activity, and read org-level reports. May manage users below Owner except billing and org deletion. |
| **Agent**          | Single brokerage                 | Day-to-day production: work assigned leads, log activities, schedule showings, create and edit listings, upload media, and move deals through pipeline stages they own or are assigned to.           |
| **Viewer**         | Single brokerage                 | Read-only access for assistants, transaction coordinators, or compliance review: view leads, properties, pipeline, and reports without mutating records.                                             |

### Actor relationships

```mermaid
flowchart LR
  PlatformAdmin[Platform Admin]
  subgraph tenant [Brokerage tenant]
    Owner[Owner]
    Manager[Manager]
    Agent[Agent]
    Viewer[Viewer]
  end
  Consumer[Marketplace consumer]

  PlatformAdmin -.->|support and ops| tenant
  Owner --> Manager
  Manager --> Agent
  Owner --> Agent
  Owner --> Viewer
  Manager --> Viewer
  Consumer -->|lead capture| tenant
```

**Marketplace consumers** (buyers and renters) are not brokerage members. They search public listings, save favorites, and submit lead forms that create or enrich CRM records inside the brokerage tenant via the marketplace app and API.

### Authorization model

- **Tenant boundary:** every business row uses `tenant_id` referencing `organization.id` (Better Auth organization plugin). Row-Level Security (RLS) enforces isolation in PostgreSQL for business tables.
- **Role hierarchy:** Owner ⊃ Manager ⊃ Agent; Viewer is parallel read-only (`@propai/shared` — see [ADR 002](./adr/002-identity-organizations-roles.md)).
- **Defense in depth:** Fastify middleware resolves session → `organization.id`; handlers use `runInTenantContext`; RLS on `propai_app` role. Never rely on UI alone.

**Foundation v0.1 (implemented):** full data-plane detail in [Multi-tenancy & RLS](#multi-tenancy--row-level-security-foundation-v01) below. **Phase 2+ (target):** CRM, properties, pipeline routes follow the same pattern.

---

## Multi-tenancy & Row-Level Security (Foundation v0.1)

Implemented in Phase 1 (Days 6–15). Sign-off: [BACKEND-FOUNDATION-CHECKLIST.md](./BACKEND-FOUNDATION-CHECKLIST.md) · tag `foundation-v0.1.0`.

### Data plane (request → database)

```mermaid
flowchart LR
  subgraph client [Client]
    Browser[Browser / Postman / Vitest]
  end

  subgraph api [apps/api — Fastify]
    V1["/v1/* routes"]
    TC[tenant-context plugin]
    Session[getSessionFromRequest]
    Resolve[resolveTenantId]
    Handler[Route handler]
    RTC[runInTenantContext]
  end

  subgraph db [PostgreSQL — Docker / Neon]
    SetCfg["set_config('app.current_tenant')"]
    RLS[RLS policies]
    Tables[(test_items · audit_logs · …)]
  end

  Browser -->|Cookie or Bearer session| V1
  V1 --> TC
  TC --> Session
  Session -->|activeOrganizationId| Resolve
  Resolve -->|organization.id| Handler
  Handler --> RTC
  RTC --> SetCfg
  SetCfg --> RLS
  RLS --> Tables
```

**Sequence (typical read):**

```mermaid
sequenceDiagram
  participant C as Client
  participant F as Fastify /v1
  participant S as Better Auth session
  participant R as resolveTenantId
  participant T as runInTenantContext
  participant P as Postgres propai_app

  C->>F: GET /v1/test-items
  F->>S: getSessionFromRequest
  S-->>F: activeOrganizationId
  F->>R: map to organization.id
  R-->>F: tenantId
  F->>T: transaction + set_config
  T->>P: SELECT … (RLS filters rows)
  P-->>F: tenant-scoped rows only
  F-->>C: 200 JSON
```

| Step | Component | Responsibility |
| ---- | --------- | -------------- |
| 1 | Better Auth `session` | `activeOrganizationId` — active brokerage |
| 2 | `resolveTenantId()` | Validates UUID; returns `organization.id` (tenant root for RLS) |
| 3 | `tenant-context` plugin | Sets `request.tenantId`; **401** without session, **403** without org |
| 4 | `runInTenantContext()` | `set_config('app.current_tenant', tenantId, true)` inside transaction |
| 5 | `getAppDb()` | Non-superuser `propai_app` — RLS not bypassed |
| 6 | RLS policy | `tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid` |

Code references: `apps/api/src/plugins/tenant-context.ts`, `apps/api/src/modules/auth/resolve-tenant-id.ts`, `packages/db/src/tenant-context.ts`, `packages/db/src/client.ts`.

### Defense in depth

```mermaid
flowchart TB
  subgraph layer1 [Layer 1 — Application]
    MW[Fastify tenant-context on /v1/*]
    RBAC[require-member-role / permissions]
    Body[Never trust tenant_id from client body]
  end

  subgraph layer2 [Layer 2 — Session mapping]
    BA[Better Auth activeOrganizationId]
    Map[resolveTenantId → organization.id]
  end

  subgraph layer3 [Layer 3 — Database]
    AppRole[propai_app role — no superuser bypass]
    Ctx[app.current_tenant per transaction]
    RLS[FORCE ROW LEVEL SECURITY]
  end

  MW --> BA
  BA --> Map
  Map --> AppRole
  AppRole --> Ctx
  Ctx --> RLS
```

| Layer | If it fails alone | RLS still protects? |
| ----- | ----------------- | ------------------- |
| Missing `WHERE tenant_id` in query | Yes — policy hides other tenants' rows |
| Wrong `tenant_id` in INSERT body | Yes — `WITH CHECK` must match session context |
| Superuser / `getDb()` in app routes | **No** — bypasses RLS; use `getAppDb()` only |
| No `runInTenantContext` | Yes — zero rows (empty `app.current_tenant`) |

### Tables: RLS vs no RLS

```mermaid
flowchart LR
  subgraph noRls [No RLS — identity plane]
    user[user]
    session[session]
    account[account]
    organization[organization]
    member[member]
    invitation[invitation]
  end

  subgraph withRls [RLS — business plane tenant_id → organization.id]
    tenant_settings[tenant_settings]
    test_items[test_items POC]
    audit_logs[audit_logs]
    properties_future[properties — Phase 2 target]
  end

  organization --> tenant_settings
  organization --> test_items
  organization --> audit_logs
  organization -.-> properties_future
```

Auth tables are isolated by **application session** and membership checks, not PostgreSQL RLS. Business data is isolated by **session → tenant context → RLS** (see [ADR 001](./adr/001-rls-multi-tenancy.md), [ADR 002](./adr/002-identity-organizations-roles.md)).

### Verify locally

```bash
pnpm docker:up && pnpm db:migrate
pnpm db:rls-test
pnpm test:api
```

See [LOCAL-DEV.md](./LOCAL-DEV.md) and [api/api-scaffold.md](./api/api-scaffold.md).

---

## Brokerage flow

Eight steps describe the default lifecycle from onboarding a brokerage to measurable outcomes after close. Steps map to CRM, pipeline, marketplace, and analytics modules.

| Step  | Name                     | What happens                                                                                                                                                                            | Primary actors           |
| ----- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **1** | **Onboard organization** | Brokerage signs up, selects plan, completes profile (license, markets, branding). Owner invites Managers and Agents. Demo or production tenant is provisioned with RLS policies active. | Owner, Platform Admin    |
| **2** | **Capture demand**       | Leads enter via public marketplace forms, manual CRM entry, CSV import, or integrations. Source, budget, and timeline are stored; duplicates are flagged.                               | Agent, Manager, Consumer |
| **3** | **Qualify and assign**   | Manager or rules engine scores the lead; record is assigned to an Agent or team queue. Status moves from _new_ to _qualified_ or _nurture_.                                             | Manager, Agent           |
| **4** | **Engage and show**      | Agent contacts the lead, logs calls and messages, schedules showings, and links interested parties to active listings. Activity timeline and tasks stay in the CRM.                     | Agent                    |
| **5** | **Negotiate offer**      | Deal enters pipeline stage _offer_ / _negotiation_: price, contingencies, and key dates tracked. Real-time updates via dashboard WebSocket where enabled.                               | Agent, Manager           |
| **6** | **Under contract**       | Stage _under contract_ / _pending_: escrow milestones, document checklist, and compliance notes. Managers monitor aging and blockers.                                                   | Agent, Manager, Viewer   |
| **7** | **Close**                | Stage _closed won_: final sale price, close date, and commission-relevant fields captured. Listing status syncs to marketplace (sold/off-market).                                       | Agent, Manager           |
| **8** | **Measure and retain**   | Analytics dashboards: funnel conversion, agent performance, listing velocity, and semantic search quality. Owner reviews billing usage; nurture loops for past clients.                 | Owner, Manager           |

### Flow diagram

```mermaid
flowchart TD
  S1[1. Onboard organization]
  S2[2. Capture demand]
  S3[3. Qualify and assign]
  S4[4. Engage and show]
  S5[5. Negotiate offer]
  S6[6. Under contract]
  S7[7. Close]
  S8[8. Measure and retain]

  S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> S8
  S8 -.->|nurture and new leads| S2
```

### Pipeline alignment (target)

Default Kanban stages align with steps 3–7:

`New` → `Qualified` → `Active` → `Offer` → `Under contract` → `Closed won` (or `Closed lost`)

Listings follow a separate lifecycle (`Draft` → `Active` → `Pending` → `Sold` / `Off-market`) but link to deals when a property is under contract.

### AI and async work (cross-cutting)

- Vision, embeddings, lead scoring, and price hints run in **BullMQ workers**, never blocking HTTP.
- Feature flag `ENABLE_AI_VISION` gates costly calls for demos and cost control.
- Semantic search (pgvector) serves marketplace and dashboard with shared contracts in `packages/shared`.

---

## Public flow (summary)

The public marketplace (`apps/marketplace`) is SEO-friendly and unauthenticated. Visitors browse listings, run semantic search, open property detail, and submit interest forms. Successful submissions create tenant-scoped CRM leads that must appear on the brokerage dashboard in **real time** (WebSocket), not poll-only.

**Full step-by-step flow, acceptance criteria, and WebSocket expectations:** see [REQUIREMENTS.md](./REQUIREMENTS.md#public-flow-marketplace).

---

## Scope boundaries

**v1 out of scope (5 items):** MLS integration, mortgage calculator, 3D virtual tours, native mobile apps, multi-language i18n.

**v2 backlog (reference):** Google Calendar sync, outbound webhooks, MLS/IDX feeds, public API keys, advanced analytics exports.

**AI (v1), US property fields, MVP acceptance:** see [REQUIREMENTS.md](./REQUIREMENTS.md).

---

## API runtime (Day 12)

The Fastify app in `apps/api` exposes **liveness** (`GET /health`) and **readiness** (`GET /ready`, Postgres `SELECT 1`) for probes, plus plugins for CORS, Helmet, Zod validation, global errors, Better Auth, and tenant context on `/v1/*`.

**Audit trail (Day 13):** tenant-scoped `audit_logs` table with RLS; `GET /v1/audit-logs` for owner/manager — see [ADR 003](./adr/003-audit-logs.md).

**Technical scaffold (folder layout, plugins, curl, K8s probes):** [api/api-scaffold.md](./api/api-scaffold.md)

---

## Related documents

| Document                             | Purpose                                                        |
| ------------------------------------ | -------------------------------------------------------------- |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | **v1 scope lock** — actors, flows, AI, fields, in/out of scope |
| [BACKEND-FOUNDATION-CHECKLIST.md](./BACKEND-FOUNDATION-CHECKLIST.md) | Phase 1 sign-off (Days 6–15) |
| [PHASE-2-PLAN.md](./PHASE-2-PLAN.md) | Properties roadmap (Days 16–25) |
| [LOCAL-DEV.md](./LOCAL-DEV.md)       | Fresh clone, Docker, `pnpm dev`, smoke |
| [api/api-scaffold.md](./api/api-scaffold.md) | Day 12 API structure, `/health` vs `/ready`, ops probes |
| [AUTH-POC-FEEDBACK.md](./AUTH-POC-FEEDBACK.md) | Day 11 auth POC — **GO** |
| [adr/001-rls-multi-tenancy.md](./adr/001-rls-multi-tenancy.md) | RLS decision + POC results |
| [adr/002-identity-organizations-roles.md](./adr/002-identity-organizations-roles.md) | Organizations + roles |
| [adr/003-audit-logs.md](./adr/003-audit-logs.md) | Tenant-scoped audit trail |
| [dev-setup.md](./dev-setup.md)       | Editor, cloud, extended setup                                  |
| [../README.md](../README.md)         | Product pitch, stack, monorepo layout                          |
