# Phase 4 · Day 40 — Lead Detail Page

## Tasks

- [x] **T1** — Query `apps/web/src/modules/crm/queries/get-lead.ts`
  - `GET /v1/leads/:id` → returns `LeadResponse`
  - Throws `ApiClientError` on non-OK or invalid schema

- [x] **T2** — Query `apps/web/src/modules/crm/queries/get-lead-activities.ts`
  - `GET /v1/leads/:id/activities` → returns `LeadActivityListResponse`

- [x] **T3** — Query `apps/web/src/modules/crm/queries/create-lead-activity.ts`
  - `POST /v1/leads/:id/activities` with `{ type, content }` → returns `LeadActivityResponse`

- [x] **T4** — Query `apps/web/src/modules/crm/queries/update-lead.ts`
  - `PATCH /v1/leads/:id` with `UpdateLeadInput` → returns `LeadResponse`

- [x] **T5** — Client component `apps/web/src/modules/crm/components/lead-detail-content.tsx`
  - Sidebar: contact info (email, phone, source, created date), AI score progress bar, property link, notes, quick actions
  - Main: log activity form (type selector: note/call/email/visit_scheduled + textarea + submit)
  - Activity timeline: newest-first, icon per type (FileText/Phone/Mail/ArrowRight/Calendar), connector lines
  - "Mark as Lost": finds `isLost` pipeline stage via React Query, calls `moveLeadStage`
  - React Query mutations with `toast.success` / `toast.error` feedback

- [x] **T6** — Page `apps/web/src/app/(dashboard)/leads/[id]/page.tsx`
  - Server async component, `params: Promise<{ id: string }>`
  - Fetches lead + activities in parallel with `Promise.all`
  - `notFound()` on 404
  - `<ModuleHeader label="CRM" title="{firstName} {lastName}" description="{email}" />`
  - Passes `initialData` to `<LeadDetailContent />`

- [x] **T7** — Kanban card `apps/web/src/modules/crm/components/kanban-card.tsx`
  - Added `<ExternalLink>` icon link → `/leads/:id` with `onPointerDown` stopPropagation to avoid triggering drag

- [x] **T8** — `pnpm typecheck` (web) → ✅
