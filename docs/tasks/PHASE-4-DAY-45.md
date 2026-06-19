# Phase 4 · Day 45 — In-app notifications

> Notification bell in the dashboard header. Brokerage users get a persisted
> notification (and a live WebSocket push) when a lead is created, a lead is
> assigned to them, or a visit is scheduled — closing the loop
> _marketplace lead → CRM card → notification → email_ (Day 44 sent the email).

## Tasks

- [x] **T1** — `packages/db/src/schema/notifications.ts`
  - `notification_type` enum (`lead_created`, `lead_assigned`, `visit_scheduled`)
  - `notifications` table (id, tenantId, userId, type, title, body, leadId, readAt, createdAt) + two `(tenant_id, user_id, …)` indexes
  - Exported from `schema/index.ts` and the db package index

- [x] **T2** — `packages/db/drizzle/0010_notifications.sql` (+ `meta/_journal.json`)
  - Hand-written migration (drizzle-kit generate needs a TTY here): table, FKs, indexes, RLS tenant isolation policy, `GRANT … TO propai_app`. Applied to the local Docker DB.

- [x] **T3** — `packages/shared/src/crm/notification.ts` (+ `.test.ts`)
  - `NOTIFICATION_TYPES`, `notificationResponseSchema`, `notificationListQuerySchema`, `notificationListResponseSchema` (items + `unreadCount`), `notificationParamsSchema`, `markAllReadResponseSchema`

- [x] **T4** — `packages/shared/src/crm/lead-events.ts` + `index.ts`
  - `notificationCreatedEventSchema` added to the `realtimeEventSchema` discriminated union; exported

- [x] **T5** — `apps/api/src/modules/notifications/create-notification.ts` (+ `.test.ts`)
  - `createNotifications()` — dedupes recipients, excludes the actor (no self-notifications), inserts one row per recipient, pushes a `notification:created` realtime event each; best-effort (never throws)
  - `getTenantMemberUserIds()` — recipients for tenant-wide notifications

- [x] **T6** — `apps/api/src/modules/notifications/routes.ts` + `index.ts`
  - `GET /v1/notifications` (current user, `unreadOnly`, `limit`) → list + `unreadCount`
  - `PATCH /v1/notifications/:id/read` → mark one read (404 if not the user's)
  - `POST /v1/notifications/read-all` → mark all read → `{ updated }`
  - Registered in `app.ts` inside the `/v1` block

- [x] **T7** — notification triggers
  - `crm/routes.ts` `POST /leads` → `lead_created` to the assigned agent (or all members if unassigned)
  - `crm/routes.ts` `PATCH /leads` → `lead_assigned` to the newly assigned agent
  - `crm/routes.ts` `POST /leads/:id/schedule-visit` → `visit_scheduled` to the lead's assigned agent
  - `public/routes.ts` `POST /public/interest` → `lead_created` ("New marketplace lead") to all tenant members

- [x] **T8** — web data layer
  - `modules/notifications/queries/{get-notifications,mark-notification-read}.ts`
  - `modules/notifications/hooks/use-notifications.ts` — query + mark-read / mark-all-read mutations (`NOTIFICATIONS_QUERY_KEY`)

- [x] **T9** — `apps/web/src/components/notification-bell.tsx`
  - Bell with unread badge, dropdown list (relative time, unread highlight), mark-all-read, click → mark read + deep-link to `/leads/:id`. Falls back to the live-connection status dot when there are no unread items.

- [x] **T10** — `apps/web/src/components/dashboard-header.tsx` + `modules/crm/hooks/use-tenant-socket.ts`
  - Header renders `<NotificationBell connectionStatus={status} />` (replaces the disabled bell)
  - Socket handles `notification:created` → toast + invalidate `NOTIFICATIONS_QUERY_KEY`

- [x] **T11** — `apps/api/src/notifications.integration.test.ts`
  - marketplace interest → owner gets 1 unread `lead_created` → mark read → unread 0

- [x] **T12** — Verification
  - `pnpm --filter @propai/shared build` + tests (71) ✅; api unit tests 146 ✅ (notifications unit 3); `pnpm --filter @propai/web typecheck` ✅; api typecheck clean (pre-existing `brokerage-auth.ts:247` aside)
  - Drove the live server: sign up → `POST /public/interest` → `GET /v1/notifications` returns `unreadCount: 1` (`lead_created`, "New marketplace lead") → mark read → `unreadCount: 0`. See `PHASE-4-DAY-45-MANUAL.md`.

## Notes

- Notifications are tenant-isolated by RLS; the API additionally filters by the session user. The realtime push goes over the tenant channel and carries `userId`; the client invalidates its own (server-filtered) notifications query.
- The live `lead:created` CRM-card update for marketplace leads is intentionally left for the guide's Day 49 (marketplace lead capture); Day 45 only adds the notification.
- Same env caveats as Day 44: `*.integration.test.ts` fail under vitest (sign-up 500 in that env only; live server is fine), and `error-handler.test.ts` fails on a pre-existing `test_items` cleanup issue.
