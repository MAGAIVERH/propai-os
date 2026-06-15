# Phase 4 · Day 38 — Kanban Board UI (Functional)

## Tasks

- [x] **T1** — API query `apps/web/src/modules/crm/queries/get-pipeline-stages.ts`
  - `getPipelineStages()` → `GET /v1/pipeline-stages`, validated with `pipelineStageListResponseSchema`

- [x] **T2** — API query `apps/web/src/modules/crm/queries/get-leads.ts`
  - `getLeads()` → `GET /v1/leads?limit=100`, validated with `leadListResponseSchema`

- [x] **T3** — API mutation `apps/web/src/modules/crm/queries/move-lead-stage.ts`
  - `moveLeadStage(leadId, stageId)` → `PATCH /v1/leads/:id/stage`

- [x] **T4** — Kanban hook `apps/web/src/modules/crm/hooks/use-kanban.ts`
  - `useQuery` for stages + leads; `useMemo` to group leads by `stageId` into `Map`
  - `useMutation` with optimistic update pattern: `onMutate` (cancel + snapshot + optimistic set) → `onError` (revert) → `onSettled` (invalidate)

- [x] **T5** — Kanban card `apps/web/src/modules/crm/components/kanban-card.tsx`
  - `useDraggable` with `data: { lead }` for DnD identification
  - Shows: name, source (`via {source}`), AI score badge (≥70 default / ≥40 secondary / else outline), agent avatar placeholder
  - `KanbanCardOverlay` for `DragOverlay` (no transform)

- [x] **T6** — Kanban column `apps/web/src/modules/crm/components/kanban-column.tsx`
  - `useDroppable` with stage ID; visual highlight (`border-primary/50 bg-primary/5`) when `isOver`
  - `min-h-48` drop zone; "Drop leads here" empty state
  - `KanbanColumnSkeleton` for loading state

- [x] **T7** — Kanban board `apps/web/src/modules/crm/components/kanban-board.tsx`
  - `DndContext` with `pointerWithin` collision detection
  - `handleDragStart` sets active lead state; `handleDragEnd` calls `moveLead()`, skips same-stage drops
  - Renders 4-column skeleton while loading

- [x] **T8** — Leads page content `apps/web/src/modules/crm/components/leads-page-content.tsx`
  - `"use client"` wrapper with `ModuleHeader`, `KanbanBoard`, empty state

- [x] **T9** — Leads page `apps/web/src/app/(dashboard)/leads/page.tsx`
  - Replaced placeholder with `<LeadsPageContent />`

- [x] **T10** — `pnpm typecheck` (api + web) → ✅
