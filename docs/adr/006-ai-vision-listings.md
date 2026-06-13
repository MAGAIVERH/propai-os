# ADR 006: AI vision for property listings

**Status:** Accepted  
**Date:** 2026-06-13  
**Context:** Phase 3 Days 26–30 — automatically generate listing titles, descriptions, and structured data from property photos to eliminate manual agent data entry.

---

## Decision

PropAI OS uses **Google Gemini** (via Vercel AI SDK `generateObject()`) to analyze property images and return structured listing data. Processing is **asynchronous** — photos are queued to BullMQ and the worker calls Gemini. The result is stored in session storage and surfaced back to the browser via polling so the HTTP request does not block on LLM latency.

### Architecture

```
Browser → POST /v1/ai/analyze-property-images
       ↓ (Redis rate limit check)
       → enqueue job → Redis queue (ai-analyze-images)
       ↓
       ← 202 { jobId }

Browser → GET /v1/ai/jobs/:jobId   (poll every 2 s)
       ↓ (job status from Redis)
       ← 200 { status, result }

BullMQ worker (apps/api/src/worker.ts)
  → Gemini vision call (Vercel AI SDK)
  → generateObject() → structured JSON
  → store result in Redis job
```

### Model choice

| Model | Why chosen |
| ----- | ---------- |
| `gemini-2.0-flash` (default) | Best cost-to-quality for multi-image property analysis; free tier available |
| Override via `GEMINI_MODEL` | Easy to swap to Flash Thinking or Pro without code change |

Vercel AI SDK handles the Google provider; `GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` both work.

### Output schema (`PropertyImageAnalysis`)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `title` | `string` | Suggested listing title |
| `description` | `string` | Marketing copy |
| `features` | `string[]` | Bullet-point highlights |
| `propertyType` | enum | `single_family`, `condo`, `townhouse`, `multi_family` |
| `bedrooms` | `number \| null` | Estimated from visible rooms |
| `bathrooms` | `string \| null` | `"2.5"` format |
| `sqFt` | `number \| null` | Estimate only if inferable |
| `condition` | enum | `excellent`, `good`, `fair`, `needs_work` |

### Rate limiting

- 10 analyses per tenant per hour (Redis sliding window, 3 600 s TTL)
- Exceeding limit → `429 Too Many Requests` + `Retry-After` header
- Prevents runaway API costs from a single brokerage

### Security

- Image URLs validated against tenant's R2 bucket prefix before dispatch to Gemini (prevents SSRF)
- Validation helper: `apps/api/src/lib/validate-tenant-image-url.ts`

### Feature flag

```bash
ENABLE_AI_VISION=false   # default — returns MOCK_PROPERTY_IMAGE_ANALYSIS instantly
ENABLE_AI_VISION=true    # enables real Gemini call + BullMQ queue
```

Mock path returns immediately with `200 { result }` — no queue, no Redis needed. Allows frontend development and CI without AI credentials.

---

## Cost notes

| Metric | Estimate |
| ------ | -------- |
| Model | Gemini Flash 2.0 |
| Input cost | ~$0.10 / 1M tokens |
| Tokens per image | ~500–1 000 (image + system prompt) |
| Images per analysis | Up to 10 |
| Cost per analysis | ~$0.0005–$0.001 |
| Rate limit cap | 10 analyses/hour/tenant = max ~$0.01/hour/tenant |
| Free tier | Gemini free tier covers dev/demo usage |

Compared to OpenAI GPT-4o Vision (~$5–10 / 1M input tokens), Gemini Flash is 50-100× cheaper per token while maintaining sufficient quality for structured listing extraction.

---

## Consequences

### Positive

- Agents save 10–20 min per listing (no manual description writing)
- Structured output feeds bedrooms/sqFt/type directly into the property form
- Async queue means no HTTP timeout on slow vision calls
- Mock flag means CI never calls a real LLM

### Negative / follow-ups

- Latency: 2–5 s per job (acceptable for async UX)
- Gemini free tier rate limits may require upgrade for high-volume brokerages
- `sqFt` and `bathrooms` estimates from photos are unreliable — UI shows them as suggestions, not ground truth
- BullMQ + Redis dependency for the async path (Day 28)

---

## References

- `apps/api/src/modules/ai/workers/analyze-property-images-worker.ts` — BullMQ worker
- `apps/api/src/modules/ai/queues/analyze-images-queue.ts` — queue enqueue helper
- `apps/api/src/lib/ai-vision-rate-limit.ts` — Redis rate limiter
- `apps/api/src/lib/validate-tenant-image-url.ts` — SSRF guard
- `packages/shared/src/ai/property-image-analysis.ts` — Zod output schema
- [ADR 005 — Object storage (R2)](./005-object-storage-r2.md) — image URL origin
- [ADR 007 — Semantic search + pgvector](./007-semantic-search-pgvector.md)
