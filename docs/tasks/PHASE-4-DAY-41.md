# Phase 4 · Day 41 — Create Lead & Delete Lead

## Tasks

- [x] **T1** — Query `apps/web/src/modules/crm/queries/create-lead.ts`
  - `POST /v1/leads` with `CreateLeadInput` → returns `LeadResponse`

- [x] **T2** — Query `apps/web/src/modules/crm/queries/delete-lead.ts`
  - `DELETE /v1/leads/:id` → void (soft delete on API)

- [x] **T3** — Component `apps/web/src/modules/crm/components/create-lead-sheet.tsx`
  - Controlled Sheet (`open` / `onOpenChange` props)
  - React Hook Form + `zodResolver` with inline form schema
  - Fields: firstName, lastName (required), email (required), phone, source, stageId (Select from pipeline stages), notes (all optional)
  - `stageId` Select populated from `PIPELINE_STAGES_QUERY_KEY` cache (staleTime 5 min)
  - On success: invalidates `LEADS_QUERY_KEY`, resets form, closes sheet, `toast.success`

- [x] **T4** — `apps/web/src/modules/crm/components/leads-page-content.tsx`
  - Added `useState(false)` for sheet open state
  - Added "New Lead" `<Button>` (Plus icon) in the toolbar row
  - Updated empty-leads hint text to reference "New Lead" button
  - Renders `<CreateLeadSheet />` at the bottom

- [x] **T5** — `apps/web/src/modules/crm/components/lead-detail-content.tsx`
  - Added `useRouter` for post-delete redirect
  - Added `deleteDialogOpen` state
  - Added `deleteMutation` (`DELETE /v1/leads/:id`): on success invalidates `LEADS_QUERY_KEY` + `router.push('/leads')`
  - Added "Delete Lead" ghost/destructive button in Actions sidebar
  - Added `<Dialog>` confirmation modal with Cancel and Delete buttons

- [x] **T6** — `pnpm typecheck` (web) → ✅
