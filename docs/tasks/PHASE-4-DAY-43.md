# Phase 4 · Day 43 — Real-time WebSocket updates (catch-up)

> The dev guide's Day 41 (WebSocket server) and Day 42 (WebSocket client) were
> skipped — the team built Create/Delete Lead and the Public Marketplace under
> those day numbers instead (see `PHASE-4-DAY-41.md`, `PHASE-4-DAY-42.md`).
> This task closes that gap before moving on. The guide's actual Day 43
> (Visits module) is now the next task.

## Tasks

- [x] **T1** — `apps/api/package.json`
  - Added `@fastify/websocket` (compatible with Fastify 5.7.x)

- [x] **T2** — `packages/shared/src/crm/lead-events.ts`
  - `leadCreatedEventSchema`, `leadUpdatedEventSchema`, `leadMovedEventSchema`, `leadDeletedEventSchema`, `activityCreatedEventSchema`
  - `realtimeEventSchema` — discriminated union on `type`, reused by both server and client

- [x] **T3** — `packages/shared/src/index.ts`
  - Export all realtime event schemas/types

- [x] **T4** — `apps/api/src/modules/realtime/bus.ts`
  - In-process `EventEmitter`-backed pub/sub: `publishTenantEvent(tenantId, event)`, `subscribeTenantEvents(tenantId, listener)` → unsubscribe fn
  - No Redis dependency — single API instance today; documented as the seam to swap for Redis pub/sub if horizontally scaled later

- [x] **T5** — `apps/api/src/modules/realtime/routes.ts` + `index.ts`
  - `GET /v1/realtime` upgraded to WebSocket, gated by `requireLeadsWrite` (same permission as the CRM routes)
  - Subscribes the connection to `request.tenantId`'s channel; unsubscribes on `close`/`error`

- [x] **T6** — `apps/api/src/app.ts`
  - Registered `@fastify/websocket` plugin
  - Registered `registerRealtimeModule` inside the `/v1` prefix block (inherits `tenantContextPlugin` auth)

- [x] **T7** — `apps/api/src/modules/crm/routes.ts`
  - Publishes `lead:created`, `lead:updated`, `lead:moved`, `lead:deleted`, `activity:created` at the existing mutation points

- [x] **T8** — `apps/web/src/lib/env.ts`
  - `getWsUrl()` — derives `ws(s)://` origin from the public API URL

- [x] **T9** — `apps/web/src/modules/crm/hooks/use-tenant-socket.ts`
  - `useTenantSocket()` — connects, reconnects with capped exponential backoff, validates incoming messages with `realtimeEventSchema`, invalidates `LEADS_QUERY_KEY` / `["lead-activities", leadId]`, toasts on `lead:created`
  - Returns `{ status: "connecting" | "open" | "closed" }`

- [x] **T10** — `apps/web/src/components/dashboard-header.tsx`
  - Mounts `useTenantSocket()`; renders a status dot (green/amber/gray) on the existing (disabled) Bell icon with a tooltip

- [x] **T11** — `apps/api/src/modules/realtime/bus.test.ts`
  - Unit test: publish/subscribe delivers to the right tenant only

- [x] **T12** — `apps/api/src/realtime.integration.test.ts`
  - Sign up → connect via `app.injectWS("/v1/realtime", { headers: { cookie } })` → create a lead via `POST /v1/leads` → assert the socket receives `lead:created`
  - Asserts the upgrade is rejected without a valid session cookie

- [x] **T13** — `pnpm typecheck` (shared, api, web) → ✅, `pnpm test:api` → ✅
