# Phase 4 · Day 36 — CRM Schema, Migration & Seed

## Tasks

- [x] **T1** — Drizzle schema `packages/db/src/schema/crm.ts`
  - `leadActivityTypeEnum` pg enum
  - `pipelineStages` table (tenant-scoped, sort order, color, isWon/isLost)
  - `leads` table (firstName, lastName, email, phone, source, assignedAgentId, propertyId, stageId, aiScore, notes, soft delete)
  - `leadActivities` table (leadId FK, type enum, content, createdBy)

- [x] **T2** — Migration `packages/db/drizzle/0009_crm_leads.sql`
  - CREATE TYPE lead_activity_type
  - CREATE TABLE pipeline_stages, leads, lead_activities
  - RLS policies (direct tenant_id for pipeline_stages + leads; EXISTS subquery for lead_activities)
  - GRANT permissions to propai_app role
  - Updated `drizzle/meta/_journal.json`

- [x] **T3** — Seed default pipeline stages `packages/db/src/seed/pipeline-stages.ts`
  - 6 default stages: New → Contacted → Visit Scheduled → Negotiation → Won → Lost
  - `seedDefaultPipelineStages(tenantId)` — idempotent via onConflictDoNothing
  - Wired into brokerage sign-up route after org creation

- [x] **T4** — `packages/db/src/schema/index.ts` — export new CRM tables
- [x] **T5** — `packages/db/src/index.ts` — export CRM tables + seed function

- [x] **T6** — Zod schemas `packages/shared/src/crm/lead.ts`
  - `pipelineStageSchema` + list response
  - `createLeadSchema`, `updateLeadSchema`, `moveLeadStageSchema`, `leadResponseSchema`, `leadListQuerySchema`, `leadListResponseSchema`
  - `createLeadActivitySchema`, `leadActivityResponseSchema`, `leadActivityListResponseSchema`
  - `leadParamsSchema`

- [x] **T7** — `packages/shared/src/index.ts` — export all CRM schemas and types
- [x] **T8** — Rebuild shared package (`npx tsc -p tsconfig.build.json`)
- [x] **T9** — `pnpm typecheck` → 6/6 ✅
