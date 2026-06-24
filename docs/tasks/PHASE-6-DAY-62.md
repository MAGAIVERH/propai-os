# Phase 6 · Day 62 — Onboarding wizard

> New brokerage productive in five minutes.

## Tasks
- [x] **T1** — API: `GET /v1/onboarding` returns step status (agency configured, agent invited, property added) + completed flag; `POST /v1/onboarding/complete` marks `onboarding_completed_at`.
- [x] **T2** — Dashboard checklist widget (`onboarding-checklist.tsx`): "Complete your setup (n/3)" with per-step CTAs deep-linking to General / Team / New property; auto-hides once completed; dismiss = mark complete.
- [x] **T3** — US-specific: timezone selector (default `America/New_York`) lives in `/settings/general`; state selection already part of the property form.

## Done
A new owner lands on the dashboard with a clear, linked 3-step checklist and reaches a productive state without external docs. Verified in `settings.integration.test.ts`.
