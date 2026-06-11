# Phase 3 — Day 30: Manual AI photo analysis → form prefill

Use this checklist after Day 30 T3–T5 are merged to validate the **web UI flow**: analyze photos on the property detail page → apply suggestions → review on edit → save draft.

## Prerequisites

```bash
git checkout feat/phase-3-ai-module   # or main after merge
pnpm install
pnpm docker:up                      # Postgres + Redis (+ MinIO for uploads)
```

`.env` minimum for **async** vision (real Gemini):

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

For **instant mock** (no worker, no Gemini):

```env
ENABLE_AI_VISION=false
```

Start processes:

```bash
# Terminal 1 — API
pnpm --filter @propai/api dev

# Terminal 2 — worker (required when ENABLE_AI_VISION=true)
pnpm --filter @propai/api worker:dev

# Terminal 3 — web
pnpm --filter @propai/web dev
```

Worker ready log: `analyze-property-images worker ready`.

## Steps

### 1. Sign in and create a property

1. Open `http://localhost:3000` and sign in as **owner** or **agent** with `properties:write`.
2. Create a draft property with a realistic US address (title can be minimal — AI may suggest a new one if empty).

### 2. Upload 3+ photos

1. Open the property **detail** page.
2. In the **Photos** section, upload at least **3** listing images (exterior, living room, kitchen recommended).
3. Confirm thumbnails appear in the gallery.

### 3. Analyze photos with AI

1. Below the gallery, the **Photo analysis** panel appears when images exist.
2. Read the disclaimer: *"AI-generated content — please review before publishing."*
3. Click **Analyze photos with AI**.
4. Observe progress:
   - **Mock path** (`ENABLE_AI_VISION=false`): completes immediately with badge **Ready**.
   - **Async path** (`ENABLE_AI_VISION=true`): **Queued** → **Processing** → **Ready** (poll ~2s; worker must be running).

### 4. Apply suggestions to form

1. When status is **Ready**, click **Apply suggestions to form**.
2. Expect a success toast and navigation to `/properties/[id]/edit`.
3. On the edit page, confirm:
   - Info alert: *"AI-suggested fields applied"* with the same disclaimer.
   - Pre-filled fields (typical): **title**, **description** (with feature bullets), **bedrooms**, **bathrooms**, **sq ft**, **price (USD)**.
   - **Address fields unchanged** — vision output must not overwrite location.

### 5. Review and save draft

1. Change at least one AI-suggested value (e.g. adjust price or edit description).
2. Click **Save changes**.
3. Confirm redirect to property detail and values persisted.

### 6. Regression — mock path

1. Set `ENABLE_AI_VISION=false` and restart the API (worker not required).
2. Repeat steps 3–5 on another property with photos.
3. Analysis should return **instantly** (HTTP 200 mock JSON, no queue polling).

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------- |
| Button disabled | No photos uploaded yet |
| Stuck on Queued/Processing | Worker not running or Redis down |
| 429 toast | Rate limit — wait for `Retry-After` |
| 503 toast | Redis unavailable when flag is on |
| Edit form not pre-filled | Session storage cleared — run **Apply** again from detail page |
| Analysis failed | Invalid presigned URLs, Gemini error, or worker crash — check API/worker logs |

## Done criteria

- [ ] Detail page shows **Analyze photos with AI** when images exist
- [ ] Progress states visible (Queued / Processing / Ready or Failed)
- [ ] Disclaimer visible on detail and edit form after apply
- [ ] **Apply suggestions** opens edit with pre-filled listing fields
- [ ] Agent can edit values before **Save changes**
- [ ] `ENABLE_AI_VISION=false` → instant mock, no worker
- [ ] `pnpm typecheck` passes

## Related docs

- [PHASE-3-DAY-30.md](./PHASE-3-DAY-30.md) — task pack
- [PHASE-3-DAY-28-MANUAL.md](./PHASE-3-DAY-28-MANUAL.md) — async API/worker smoke test
- [LOCAL-DEV.md](../LOCAL-DEV.md) — environment setup
