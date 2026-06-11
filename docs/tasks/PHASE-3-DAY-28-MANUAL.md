# Phase 3 — Day 28: Manual async vision review (queue + worker)

Use this checklist after Day 28 T4–T5 are merged to validate the **async BullMQ flow** with real Gemini output.

## Prerequisites

```bash
git checkout feat/phase-3-ai-module   # or main after merge
pnpm install
pnpm docker:up                      # Postgres + Redis
```

`.env` minimum for async vision:

```env
ENABLE_AI_VISION=true
GEMINI_API_KEY=<your-key>

REDIS_URL=redis://localhost:6379
REDIS_BULLMQ_URL=redis://localhost:6379

S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=propai-uploads
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
```

Start **two processes** (separate terminals):

```bash
# Terminal 1 — API
pnpm --filter @propai/api dev

# Terminal 2 — BullMQ worker
pnpm --filter @propai/api worker:dev
```

Worker ready log: `analyze-property-images worker ready`.

## Steps

### 1. Sign in and create a property

1. Open the web app and sign in as **owner** or **agent** with `properties:write`.
2. Create a draft property with a realistic US address.

### 2. Upload 5 photos

1. Presign → PUT → confirm for each image (same as Day 27).
2. Upload **5 photos**: exterior, living room, kitchen, primary bedroom, bathroom or backyard.

Optional: start MinIO if not running:

```bash
docker compose --profile storage up -d
```

### 3. Collect presigned download URLs

```bash
curl "http://localhost:3333/v1/uploads/presign-download?key=tenant%2F<org-id>%2Fproperty%2F<property-id>%2F<file-id>.jpg" \
  -H "Cookie: <session-cookie>"
```

Copy each `downloadUrl`.

### 4. POST analyze (enqueue)

```bash
curl -i -X POST http://localhost:3333/v1/ai/analyze-property-images \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "imageUrls": [
      "<presigned-url-1>",
      "<presigned-url-2>",
      "<presigned-url-3>",
      "<presigned-url-4>",
      "<presigned-url-5>"
    ]
  }'
```

Expected: **HTTP 202** with body `{ "jobId": "<id>" }`.

### 5. Poll job status

Replace `<job-id>` from step 4:

```bash
curl "http://localhost:3333/v1/ai/jobs/<job-id>" \
  -H "Cookie: <session-cookie>"
```

Poll every few seconds until `status` is `completed` or `failed`.

| Status | Meaning |
| ------ | ------- |
| `queued` | Waiting for worker |
| `processing` | Worker calling Gemini |
| `completed` | `result` contains analysis JSON |
| `failed` | Check `failedReason`; worker logs in terminal 2 |

Expected when worker succeeds: **HTTP 200** with `status: "completed"` and `result` matching `propertyImageAnalysisSchema`.

### 6. Review output

Same criteria as Day 27 — verify `bedrooms`, `bathrooms`, `sqFt`, `features`, `description`, `seoTitle`, `suggestedPriceUSD` are plausible and grounded in visible photos.

### 7. Rate limit smoke test (optional)

Send **11 enqueue requests** within an hour for the same organization (worker can stay running).

- Requests 1–10: **202** + `jobId`
- Request 11: **429** with `Retry-After` header

### 8. Flag-off regression

Set `ENABLE_AI_VISION=false`, restart API only (worker optional).

```bash
curl -X POST http://localhost:3333/v1/ai/analyze-property-images \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"imageUrls":["https://example.com/photo.jpg"]}'
```

Expected: **HTTP 200** with Day 26 mock JSON (no queue, no Redis required for analyze).

## Pass criteria

- [ ] Worker starts and logs `analyze-property-images worker ready`
- [ ] POST returns **202** + valid `jobId` when flag is on
- [ ] GET `/v1/ai/jobs/:jobId` transitions `queued` → `processing` → `completed`
- [ ] Completed `result` validates against `propertyImageAnalysisSchema`
- [ ] Wrong-tenant or unknown `jobId` returns **404**
- [ ] `ENABLE_AI_VISION=false` still returns mock **200** (regression)
- [ ] Automated suite green: `pnpm --filter @propai/api test` and `pnpm typecheck`

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------- |
| POST **503** (BullMQ) | Missing `REDIS_BULLMQ_URL` or Redis down — `pnpm docker:up` |
| POST **503** (rate limit Redis) | Missing `REDIS_URL` |
| Job stuck in `queued` | Worker not running — start `pnpm --filter @propai/api worker:dev` |
| Job `failed` | Missing `GEMINI_API_KEY` or Gemini error — check worker terminal |
| GET **503** with flag off | Expected — enable `ENABLE_AI_VISION=true` to poll jobs |
| POST **400** image URLs | URL host ≠ `S3_ENDPOINT` or key not under `tenant/<org-id>/property/...` |
| POST **429** | Hourly limit (10/tenant) |

## Automated verification (before manual run)

```bash
pnpm --filter @propai/shared build
pnpm --filter @propai/api test
pnpm --filter @propai/shared test
pnpm typecheck
```
