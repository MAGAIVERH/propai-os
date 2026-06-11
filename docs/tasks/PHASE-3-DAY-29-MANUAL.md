# Phase 3 — Day 29: Manual semantic search embedding review (queue + worker)

Use this checklist after Day 29 T3–T5 are merged to validate the **async embedding flow** with real OpenAI output.

## Prerequisites

```bash
git checkout feat/phase-3-ai-module   # or main after merge
pnpm install
pnpm docker:up                      # Postgres (pgvector) + Redis
pnpm db:migrate
```

`.env` minimum for semantic search embeddings:

```env
ENABLE_SEMANTIC_SEARCH=true
OPENAI_API_KEY=<your-key>

REDIS_URL=redis://localhost:6379
REDIS_BULLMQ_URL=redis://localhost:6379
```

Start **two processes** (separate terminals):

```bash
# Terminal 1 — API
pnpm --filter @propai/api dev

# Terminal 2 — BullMQ workers (vision + embedding)
pnpm --filter @propai/api worker:dev
```

Worker ready logs:

- `analyze-property-images worker ready`
- `generate-property-embedding worker ready`

## Steps

### 1. Sign in and create a draft property

1. Open the web app and sign in as **owner** or **agent** with `properties:write`.
2. Create a property with a descriptive **title** and **description** (status `draft` is fine).

Or via API:

```bash
curl -i -X POST http://localhost:3333/v1/properties \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "title": "Spacious 4BR Colonial near Austin schools",
    "description": "Updated kitchen, fenced yard, and two-car garage.",
    "type": "single_family",
    "priceUsdCents": 52500000,
    "rentOrSale": "sale",
    "bedrooms": 4,
    "bathrooms": "3.0",
    "sqFt": 2400,
    "addressLine1": "123 Oak St",
    "city": "Austin",
    "state": "TX",
    "zipCode": "78701"
  }'
```

Copy the returned `property.id`.

### 2. Publish the property (PATCH draft → active)

```bash
curl -i -X PATCH "http://localhost:3333/v1/properties/<property-id>" \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{ "status": "active" }'
```

Expected: **200** — HTTP response is immediate; embedding runs **async** in the worker.

### 3. Wait for the worker

Watch Terminal 2 for:

```
generate-property-embedding job completed
```

Typical wait: a few seconds (depends on OpenAI latency).

### 4. Verify embedding in Postgres

```bash
docker exec propai-postgres psql -U propai -d propai -c \
  "SELECT id, embedding IS NOT NULL AS has_embedding, embedding_updated_at FROM properties WHERE status = 'active';"
```

Expected: `has_embedding = t` for the published property.

Optional dimension check:

```bash
docker exec propai-postgres psql -U propai -d propai -c \
  "SELECT id, vector_dims(embedding) AS dims FROM properties WHERE embedding IS NOT NULL LIMIT 5;"
```

Expected: `dims = 1536`.

## Regression checks

| Check | Expected |
| ----- | -------- |
| `ENABLE_SEMANTIC_SEARCH=false` | PATCH to `active` succeeds; **no** worker log for embedding |
| Day 28 vision | `ENABLE_AI_VISION=true` + worker still processes analyze-images jobs |
| Re-index | PATCH `title` or `description` on an **active** property re-enqueues embedding |

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Worker exits on start | Set `REDIS_BULLMQ_URL`; ensure Redis is healthy (`pnpm docker:up`) |
| `extension "vector" does not exist` | Use `pgvector/pgvector:pg16` image; run `pnpm db:migrate` |
| `OpenAI API is not configured` | Set `OPENAI_API_KEY` in `.env`; restart worker |
| Job completes but `has_embedding = f` | Property may not be `active` or was soft-deleted when worker ran |

## Automated verification

```bash
pnpm test:api
pnpm typecheck
```
