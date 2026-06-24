# Phase 5 · Day 49 — Lead capture from marketplace

> Visitor → lead in the brokerage CRM, in seconds. Hardened against spam and
> wired to the live dashboard.

## Tasks

- [x] **T1** — `POST /public/leads` (canonical) + `POST /public/interest` (alias)
  - Shared `handlePublicLead` in `apps/api/src/modules/public/routes.ts`: resolves the first non-won/lost pipeline stage, inserts the lead (`source: "marketplace"`), records an optional note activity.

- [x] **T2** — IP rate limit
  - `apps/api/src/lib/public-lead-rate-limit.ts`: fixed-window Redis counter, 5 submissions / 10 min / IP, `429` + `Retry-After` when exceeded. **Fails open** when Redis is unavailable (never drop a real lead on infra).

- [x] **T3** — Honeypot anti-spam
  - `website` field in the shared schema; filled value ⇒ silent `201` with a throwaway id, no DB write, no event. The form renders the input visually hidden / `aria-hidden` / `tabindex=-1`.

- [x] **T4** — Live dashboard update
  - Publishes a `lead:created` realtime event (`publishTenantEvent`) so the CRM Kanban shows the new lead instantly. Also notifies all tenant members (Day 45 notification).
  - `apps/api/src/lib/map-lead-row.ts` builds the `LeadResponse` for the event.

- [x] **T5** — Form
  - `src/components/interest-form.tsx` posts to `/public/leads`, includes the honeypot, and surfaces the `429` message.

- [x] **T6** — `apps/api/src/public-marketplace.integration.test.ts`
  - list + `X-Cache`; detail images/features arrays; `POST /public/leads` creates a lead and emits `lead:created`; honeypot drops silently (no event).

## Done

Submitting the marketplace form makes a lead appear on the Kanban within seconds (via WebSocket), with notification + spam protection.

See `PHASE-5-DAY-49-MANUAL.md` for the live end-to-end check (Redis + WebSocket).
