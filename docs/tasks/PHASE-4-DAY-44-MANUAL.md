# Phase 4 — Day 44: Manual visit confirmation email (queue + worker + Resend)

Use this checklist after Day 44 is merged to validate the **async BullMQ →
Resend flow** with a real test inbox.

## Prerequisites

```bash
git checkout main          # after merge
pnpm install
pnpm docker:up             # Postgres + Redis
```

`.env` minimum for visit confirmation emails:

```env
DATABASE_URL=postgresql://propai:propai@localhost:5432/propai
DATABASE_APP_URL=postgresql://propai_app:propai_app@localhost:5432/propai

REDIS_URL=redis://localhost:6379
REDIS_BULLMQ_URL=redis://localhost:6379   # REQUIRED — without it the enqueue is a no-op

# Resend (transactional email)
RESEND_API_KEY=<your-resend-key>
RESEND_FROM_EMAIL=<verified-sender@yourdomain.com>
```

> Without `RESEND_API_KEY` the worker logs `Skipping visit confirmation email:
> Resend is not configured` and completes the job without sending — useful to
> validate the queue wiring, but no email is delivered.

Start **two processes** (separate terminals):

```bash
# Terminal 1 — API
pnpm --filter @propai/api dev

# Terminal 2 — BullMQ worker
pnpm --filter @propai/api worker:dev
```

Worker ready log: `send-visit-confirmation worker ready`.

## Steps

### 1. Sign in / sign up a brokerage

Sign up an owner (gets `leads:write`). Keep the session cookie.

```bash
curl -i -c cj.txt -X POST http://localhost:3333/api/auth/brokerage-sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"visit-owner@test.propai-os.local","password":"password123","name":"Visit Owner","organizationName":"Visit Brokerage"}'
```

### 2. Create a property (the visit target)

```bash
curl -s -b cj.txt -c cj.txt -X POST http://localhost:3333/v1/properties \
  -H "Content-Type: application/json" \
  -d '{"title":"Austin Ranch Home","type":"single_family","priceUsdCents":45000000,"rentOrSale":"sale","bedrooms":3,"bathrooms":"2.5","sqFt":2100,"addressLine1":"123 Maple St","city":"Austin","state":"TX","zipCode":"78701"}'
```

Copy `property.id`.

### 3. Create a lead linked to the property

Use a **real inbox you control** as the lead `email` (that is where the
confirmation lands).

```bash
curl -s -b cj.txt -c cj.txt -X POST http://localhost:3333/v1/leads \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jordan","lastName":"Smith","email":"<your-test-inbox>@example.com","propertyId":"<property-id>"}'
```

Copy `lead.id`.

### 4. Schedule the visit (enqueue)

```bash
curl -i -b cj.txt -X POST http://localhost:3333/v1/leads/<lead-id>/schedule-visit \
  -H "Content-Type: application/json" \
  -d '{"scheduledAt":"2026-07-01T20:00:00.000Z","timezone":"America/Chicago"}'
```

Expected: **HTTP 201** with a `visit_scheduled` activity whose `content` reads
_"Visit scheduled for Wednesday, July 1, 2026 at 3:00 PM CDT"_.

### 5. Watch the worker

Terminal 2 should log `send-visit-confirmation job completed`. With a valid
`RESEND_API_KEY` the email is sent to the lead's inbox.

### 6. Check the inbox

Subject: _"Your property visit is confirmed — 123 Maple St, Austin, TX 78701,
Wednesday, July 1, 2026 at 3:00 PM CDT"_. Body lists property, date and time.

### 7. Audit trail

```bash
curl -s -b cj.txt http://localhost:3333/v1/audit-logs | grep visit.scheduled
```

Expected: a `visit.scheduled` entry for the lead. If sending fails on all 3
attempts, a `visit.confirmation_failed` entry is written instead.

## Pass criteria

- [ ] Worker starts and logs `send-visit-confirmation worker ready`
- [ ] `POST /schedule-visit` returns **201** with a `visit_scheduled` activity
- [ ] Worker logs `send-visit-confirmation job completed`
- [ ] Confirmation email arrives in the test inbox with the expected subject
- [ ] Audit log has `visit.scheduled` (or `visit.confirmation_failed` after retries)
- [ ] **400** when scheduling a visit for a lead with no property
- [ ] Automated suite green: `pnpm --filter @propai/api test -- send-visit-confirmation visit-confirmation-email` and `pnpm --filter @propai/shared test`

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------ |
| 201 but no job in Redis | Missing `REDIS_BULLMQ_URL` — enqueue no-ops by design |
| Job stuck in `wait` | Worker not running — `pnpm --filter @propai/api worker:dev` |
| Worker logs `Resend is not configured` | Missing `RESEND_API_KEY` |
| Email not delivered, no worker error | `RESEND_FROM_EMAIL` not a verified Resend sender |
| `Error: Queue name cannot contain :` | Old queue name — must be `visits-send-confirmation` (BullMQ v5) |
| `POST /schedule-visit` **400** "A property is required" | Lead has no `propertyId` and none passed in the body |

## Automated verification (before manual run)

```bash
pnpm --filter @propai/shared build
pnpm --filter @propai/shared test
pnpm --filter @propai/api test -- send-visit-confirmation visit-confirmation-email
```
