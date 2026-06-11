# Phase 3 — Day 27: Manual vision review (5 photos)

Use this checklist after Day 27 is merged to validate real Gemini output with property photos.

## Prerequisites

```bash
git checkout feat/phase-3-ai-module   # or main after merge
pnpm install
pnpm docker:up                      # Postgres + Redis
```

`.env` minimum for real vision:

```env
ENABLE_AI_VISION=true
GEMINI_API_KEY=<your-key>
REDIS_URL=redis://localhost:6379

S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=propai-uploads
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
```

Start the API:

```bash
pnpm --filter @propai/api dev
```

## Steps

### 1. Sign in and create a property

1. Open the web app (or use API auth flow) and sign in as an **owner** or **agent** with `properties:write`.
2. Create a draft property with a realistic US address.

### 2. Upload 5 photos

1. Use the property photo upload UI (presigned PUT) or API:
   - `POST /v1/uploads/presign` → upload each file to `uploadUrl`
   - `POST /v1/properties/:id/images/confirm` for each image
2. Upload **5 photos** that together show:
   - Exterior / curb appeal
   - Living room
   - Kitchen
   - Primary bedroom
   - Bathroom or backyard

### 3. Collect presigned download URLs

For each stored object key, request a download URL:

```bash
curl "http://localhost:3333/v1/uploads/presign-download?key=tenant%2F<org-id>%2Fproperty%2F<property-id>%2F<file-id>.jpg" \
  -H "Cookie: <session-cookie>"
```

Copy each `downloadUrl` from the JSON response.

### 4. POST analyze

```bash
curl -X POST http://localhost:3333/v1/ai/analyze-property-images \
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

Expected: **HTTP 200** with JSON matching the schema.

### 5. Review output

| Field | What to check |
| ----- | ------------- |
| `bedrooms` | Plausible count from bed photos (integer ≥ 0) |
| `bathrooms` | Whole or half baths (e.g. `2`, `2.5`) |
| `sqFt` | Positive integer; rough order of magnitude for home size |
| `features` | Tags visible in photos (pool, garage, etc.) — no invented luxury features |
| `description` | US MLS-style copy; 2–4 sentences; matches visible condition |
| `seoTitle` | Short listing title; not empty |
| `suggestedPriceUSD` | Whole USD or `null` if photos lack enough context |

### 6. Rate limit smoke test (optional)

Send **11 analyze requests** within an hour for the same organization.

- Requests 1–10: **200**
- Request 11: **429** with `Retry-After` header

## Pass criteria

- [ ] All 5 presigned URLs accepted (no `400` for URL validation)
- [ ] Response validates against `propertyImageAnalysisSchema`
- [ ] Bedrooms / bathrooms / sqFt are **reasonable**, not hallucinated extremes
- [ ] `features` reflect visible amenities only
- [ ] `description` and `seoTitle` are usable on a listing page
- [ ] `ENABLE_AI_VISION=false` still returns Day 26 mock (regression)

## Troubleshooting

| Symptom | Likely cause |
| ------- | ------------- |
| `503` Redis | `pnpm docker:up` or set `REDIS_URL` |
| `503` Gemini | Missing `GEMINI_API_KEY` |
| `400` image URLs | URL host ≠ `S3_ENDPOINT` or key not under `tenant/<org-id>/property/...` |
| `429` | Hourly limit (10/tenant) — wait or use another org |
| `502` | Model returned invalid JSON — retry or adjust `GEMINI_MODEL` |
