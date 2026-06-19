# Phase 4 · Day 44 — Visit confirmation emails (async)

> Background job for notifications. When a visit is scheduled on a CRM lead, a
> BullMQ job renders and sends a confirmation email via Resend, with retry and
> audit logging on failure.
>
> Visits are modelled as CRM `visit_scheduled` lead activities (there is no
> separate `visits` table); this task also adds the `POST /leads/:id/schedule-visit`
> endpoint that the guide's Day 43 "Visits module" implied — see
> `PHASE-4-DAY-43.md` for why the day numbering shifted.

## Tasks

- [x] **T1** — `packages/shared/src/crm/visit.ts`
  - `scheduleVisitSchema` (body: `scheduledAt` ISO, `timezone` IANA, optional `propertyId`, `notes`), `scheduleVisitResponseSchema`
  - `sendVisitConfirmationJobDataSchema` (tenantId, leadId, propertyId, scheduledAt, timezone)
  - `VISITS_SEND_CONFIRMATION_QUEUE_NAME` / `VISITS_SEND_CONFIRMATION_JOB_NAME`

- [x] **T2** — `packages/shared/src/audit/audit-log.ts`
  - New audit actions `visit.scheduled`, `visit.confirmation_failed`

- [x] **T3** — `packages/shared/src/index.ts` + `packages/shared/src/crm/visit.test.ts`
  - Export visit schemas/types/constants; unit tests for the schemas

- [x] **T4** — `apps/api/package.json`
  - Added `resend` dependency

- [x] **T5** — `apps/api/src/lib/resend-client.ts`
  - Lazy singleton Resend client (`getResendClient()` → `null` when `RESEND_API_KEY` unset so the worker no-ops gracefully), `requireResendClient()`, `getResendFromEmail()`

- [x] **T6** — `apps/api/src/modules/crm/visit-confirmation-email.ts` (+ `.test.ts`)
  - `buildVisitConfirmationEmail()` → `{ subject, html, text }`. US English copy. Subject:
    _"Your property visit is confirmed — {address}, {date} at {time} {timezone}"_
  - Date/time/timezone rendered from the UTC instant + IANA zone via `Intl`; falls back to UTC for an invalid zone; HTML-escapes user data
  - `formatVisitScheduleSummary()` — human-readable summary reused for the activity timeline

- [x] **T7** — `apps/api/src/modules/crm/queues/send-visit-confirmation-queue.ts` (+ `.test.ts`)
  - BullMQ queue on `VISITS_SEND_CONFIRMATION_QUEUE_NAME`; **attempts 3**, exponential backoff (5s), `removeOnComplete`
  - `enqueueSendVisitConfirmationJob()`; returns `null`/throws gracefully when `REDIS_BULLMQ_URL` is unset

- [x] **T8** — `apps/api/src/modules/crm/workers/send-visit-confirmation-worker.ts` (+ `.test.ts`)
  - Loads lead email + property address in tenant context, renders + sends the Resend email
  - No-ops when Resend is unconfigured or lead/property is unavailable
  - On the **final** failed attempt writes audit `visit.confirmation_failed`, then rethrows so BullMQ records the failure

- [x] **T9** — `apps/api/src/modules/crm/enqueue-visit-confirmation.ts`
  - `enqueueVisitConfirmationJobSafe()` — best-effort enqueue; never fails the originating request

- [x] **T10** — `apps/api/src/modules/crm/routes.ts`
  - `POST /v1/leads/:id/schedule-visit` — creates a `visit_scheduled` activity, audits `visit.scheduled`, publishes realtime `activity:created`, and enqueues the confirmation job
  - Property resolved as `body.propertyId ?? lead.propertyId`; **400** when neither is present, **404** for unknown lead/property

- [x] **T11** — `apps/api/src/worker.ts`
  - Registers the visit confirmation worker + closes the queue/worker on shutdown

- [x] **T12** — `apps/api/src/visit-schedule.integration.test.ts`
  - Sign up → create property → create lead → `POST /schedule-visit` → assert 201 + `visit_scheduled` activity + `visit.scheduled` audit; 400 when the lead has no property

- [x] **T13** — Bug fix: BullMQ v5 forbids `":"` in queue names
  - Renamed the queue from `visits:send-confirmation` to `visits-send-confirmation`. Surfaced only when a real `Worker` is instantiated (unit tests mock `bullmq`; locally `REDIS_BULLMQ_URL` is usually unset). **The existing AI queues (`ai:generate-embedding`, `ai:analyze-images`) have the same latent bug** and should be renamed in a follow-up.

- [x] **T14** — Verification
  - `pnpm --filter @propai/shared build` → ✅, shared tests (66) → ✅
  - `pnpm --filter @propai/api test -- send-visit-confirmation visit-confirmation-email` → ✅ (email 4, queue 3, worker 7)
  - Drove the live server (`pnpm dev`, :3333): schedule-visit returned **201** with activity _"Visit scheduled for Wednesday, July 1, 2026 at 3:00 PM CDT"_ + `visit.scheduled` audit; enqueued + processed a real BullMQ job (worker completed it). See `PHASE-4-DAY-44-MANUAL.md`.

## Notes / follow-ups

- Local `.env` is missing `REDIS_BULLMQ_URL` (present in `.env.example`); without it the enqueue is a best-effort no-op. Set it + `RESEND_API_KEY` / `RESEND_FROM_EMAIL` and run the worker to deliver real email.
- Pre-existing, unrelated: `pnpm --filter @propai/api typecheck` reports one error in `modules/auth/routes/brokerage-auth.ts:247` (confirmed on clean `main`); the `*.integration.test.ts` suite fails under vitest because sign-up 500s in that environment only (the live server signs up fine).
