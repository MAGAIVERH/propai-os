# Phase 4 — Day 45: Manual in-app notifications (bell + WebSocket)

Validate the full loop: an event creates a persisted notification, the bell
shows an unread count, and the WebSocket pushes it live.

## Prerequisites

```bash
pnpm install
pnpm docker:up                 # Postgres + Redis
# Apply the notifications migration to the local DB (drizzle-kit generate needs a TTY):
docker exec -i propai-postgres psql -U propai -d propai < packages/db/drizzle/0010_notifications.sql
```

`.env` minimum:

```env
DATABASE_URL=postgresql://propai:propai@localhost:5432/propai
DATABASE_APP_URL=postgresql://propai_app:propai_app@localhost:5432/propai
REDIS_URL=redis://localhost:6379
```

Run API + web:

```bash
pnpm dev        # @propai/api (:3333) + @propai/web (:3000)
```

## A) UI loop (bell + live push)

1. Sign in / sign up a brokerage owner; open the dashboard. The header bell
   shows a small status dot (green = live updates connected).
2. In a second terminal, submit a marketplace lead for your org
   (`<org-id>` is the signed-in organization id):

   ```bash
   curl -s -X POST http://localhost:3333/public/interest \
     -H "Content-Type: application/json" \
     -d '{"tenantId":"<org-id>","firstName":"Jordan","lastName":"Smith","email":"jordan@example.com","message":"Interested"}'
   ```

3. Without refreshing, the dashboard should toast _"New marketplace lead"_ and
   the bell should show an unread badge (count **1**).
4. Open the bell → click the notification → it marks read (badge clears) and
   navigates to the lead card.
5. Create another notification, then use **Mark all read** → badge clears.

## B) API loop (curl)

```bash
# Sign up (save cookie)
curl -s -c cj.txt -X POST http://localhost:3333/api/auth/brokerage-sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"notif-owner@test.propai-os.local","password":"password123","name":"Notif Owner","organizationName":"Notif Brokerage"}'

# Marketplace lead for this org (copy organization.id from the response above)
curl -s -X POST http://localhost:3333/public/interest \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"<org-id>","firstName":"Jordan","lastName":"Smith","email":"jordan@example.com","message":"hi"}'

# List → expect unreadCount: 1, type "lead_created"
curl -s -b cj.txt http://localhost:3333/v1/notifications

# Mark one read, then re-list → unreadCount: 0
curl -s -b cj.txt -X PATCH http://localhost:3333/v1/notifications/<notification-id>/read
curl -s -b cj.txt http://localhost:3333/v1/notifications
```

## Other triggers to spot-check

| Trigger | How | Expected notification |
| ------- | --- | --------------------- |
| Lead assigned | `PATCH /v1/leads/:id` with `{"assignedAgentId":"<other-user>"}` | `lead_assigned` to that user |
| Visit scheduled | `POST /v1/leads/:id/schedule-visit` on a lead with an assigned agent | `visit_scheduled` to the assigned agent |
| New lead (assigned) | `POST /v1/leads` with `assignedAgentId` | `lead_created` to that agent |

> No self-notifications: the actor who triggers an event is excluded from its
> recipients. To see `lead_assigned`/`visit_scheduled`, assign to a *different*
> user (invite a second member first).

## Pass criteria

- [ ] Marketplace lead → bell badge increments live (no refresh) + toast
- [ ] `GET /v1/notifications` returns the notification with `unreadCount`
- [ ] Clicking a notification marks it read and deep-links to the lead
- [ ] **Mark all read** zeroes the badge
- [ ] `lead_assigned` / `visit_scheduled` reach the assigned agent (not the actor)
- [ ] Automated: `pnpm --filter @propai/api test -- create-notification` and `pnpm --filter @propai/shared test`

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------ |
| `relation "notifications" does not exist` | Migration not applied — run the `psql < 0010_notifications.sql` step |
| Bell badge never updates live | WebSocket not connected (status dot not green) — check `/v1/realtime` and `getWsUrl()` |
| No notification for a self-action | Expected — the actor is excluded; assign to another user |
| `GET /v1/notifications` 403 | Session lacks `leads:write` (viewer role) |
