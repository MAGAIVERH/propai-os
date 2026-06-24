# Day 49 — Manual: marketplace lead → live CRM

Verifies rate limit (Redis), honeypot, and the live `lead:created` WebSocket
push into the dashboard Kanban.

## Prereqs

```bash
docker compose up -d            # postgres + redis
# API + web (host):
DATABASE_URL=postgresql://propai:propai@localhost:5432/propai \
DATABASE_APP_URL=postgresql://propai_app:propai_app@localhost:5432/propai \
REDIS_URL=redis://localhost:6379 \
pnpm dev                        # @propai/api (3333) + @propai/web (3000)

# Marketplace (separate terminal):
pnpm --filter @propai/marketplace dev   # localhost:3001
```

Set `apps/marketplace/.env`:
```
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_MARKETPLACE_TENANT_ID=<your org id>
```
(Sign up at `localhost:3000`, create an active property, copy the org id.)

## Steps

1. **Lead → Kanban (live):** open the dashboard CRM board. On the marketplace,
   open a listing → "Request a showing" → submit. Within a second a new card
   appears on the board (WebSocket `lead:created`) and the bell shows an unread
   notification.

2. **Honeypot:** with devtools, set the hidden `website` input to any value and
   submit. You get a normal success screen, but **no** card/notification appears
   (server drops it silently).

3. **Rate limit:** submit the form > 5 times within 10 minutes from the same IP.
   The 6th returns `429` with a friendly retry message and a `Retry-After`
   header. (Counter lives in Redis: `KEYS public:lead:rate:*`.)

## Notes

- Rate limiting **fails open** if Redis is down — a real lead is never lost.
- The dashboard subscribes per-tenant; the lead card and the notification are
  two independent signals (Day 43 realtime + Day 45 notifications).
