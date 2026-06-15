# Phase 4 · Day 37 — Leads CRUD API

## Tasks

- [x] **T1** — Audit actions `packages/shared/src/audit/audit-log.ts`
  - Added `lead.created`, `lead.updated`, `lead.deleted`, `lead.stage_changed` to `AUDIT_ACTIONS`

- [x] **T2** — Cursor utility `apps/api/src/lib/lead-cursor.ts`
  - `LeadCursor` type, `encodeLeadCursor`, `decodeLeadCursor`
  - Same pattern as `property-cursor.ts`

- [x] **T3** — CRM routes `apps/api/src/modules/crm/routes.ts`
  - `GET /leads` — list with cursor pagination (`createdAt|id`), soft-delete filter, tenant RLS
  - `POST /leads` — create lead, emit `lead.created` audit event
  - `GET /leads/:id` — fetch single lead (soft-delete aware)
  - `PATCH /leads/:id` — update lead fields, emit `lead.updated`
  - `DELETE /leads/:id` — soft delete, emit `lead.deleted`
  - `PATCH /leads/:id/stage` — move stage in single transaction; inserts `stage_change` activity and `lead.stage_changed` audit event
  - `POST /leads/:id/activities` — append note/call/email/visit_scheduled activity
  - `GET /pipeline-stages` — list all tenant pipeline stages ordered by `sortOrder`
  - All routes: `runInTenantContext` for RLS, `requireLeadsWrite` preHandler, explicit `reply: FastifyReply` typing

- [x] **T4** — CRM module barrel `apps/api/src/modules/crm/index.ts`
  - `registerCrmModule(app)` → calls `registerCrmRoutes`

- [x] **T5** — App wiring `apps/api/src/app.ts`
  - Imported and called `registerCrmModule(v1)` inside `/v1` scope

- [x] **T6** — Integration tests `apps/api/src/crm.integration.test.ts`
  - Full CRUD flow (create → note → update → audit)
  - Stage move + activity insertion
  - 401 unauthenticated rejection
  - Soft delete + 404 on refetch

- [x] **T7** — Shared package rebuild
  - `pnpm --filter @propai/shared build` after adding audit actions
  - `pnpm typecheck` → ✅
