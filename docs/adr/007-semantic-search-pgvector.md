# ADR 007: Semantic search with pgvector

**Status:** Accepted  
**Date:** 2026-06-13  
**Context:** Phase 3 Days 29–31 — buyers describe what they want in natural language ("cozy 3-bed near downtown Austin under $500K"); keyword search misses these queries. PropAI OS must match intent to listings.

---

## Decision

PropAI OS uses **OpenAI text-embedding-3-small** to embed property text and buyer queries into 1 536-dimension vectors, stored in PostgreSQL via **pgvector** (`<=>` cosine distance). A public `GET /search/semantic` endpoint embeds the query and returns ranked results without requiring user authentication.

### Architecture

```
Publish property
  → POST /v1/properties/:id/publish
  → enqueue embedding job → Redis (ai-generate-embedding queue)

BullMQ embedding worker
  → build property text (title + description + features + city + type)
  → OpenAI embed(text-embedding-3-small) → vector[1536]
  → UPDATE properties SET embedding = $vector WHERE id = $id

Public search
  → GET /search/semantic?q=cozy+3bed+Austin&city=Austin
  → embed query with same model
  → SELECT … ORDER BY embedding <=> $query_vector LIMIT 20
  → return ranked properties with relevance score
```

### Vector column

```sql
-- migration 0008_property_embeddings.sql
ALTER TABLE properties
  ADD COLUMN embedding vector(1536);

CREATE INDEX properties_embedding_idx
  ON properties
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

Drizzle custom type: `packages/db/src/schema/vector.ts` → `vector1536`.

### Embedding model choice

| Option | Dimensions | Cost / 1M tokens | Decision |
| ------ | ---------- | ---------------- | -------- |
| `text-embedding-3-small` | 1 536 | $0.02 | **Chosen** |
| `text-embedding-3-large` | 3 072 | $0.13 | Overkill for address-level property text |
| `text-embedding-ada-002` | 1 536 | $0.10 | Superseded by 3-small at 5× lower cost |

`text-embedding-3-small` was validated to rank relevant Austin properties in top-3 for natural-language queries in local testing.

### Search endpoint

```
GET /search/semantic
  ?q=<natural language query>     required
  &tenantId=<uuid>               required
  &limit=20                      optional (max 100)
  &city=Austin                   optional filter
  &state=TX                      optional filter
  &beds=3                        optional filter
  &type=single_family            optional filter
  &minPriceUsdCents=50000000     optional filter
  &maxPriceUsdCents=60000000     optional filter
  &rentOrSale=sale               optional filter
```

Route is registered **before** `tenantContextPlugin` so it does not require a session — public marketplace pages can call it directly from the browser or a Next.js Server Component.

Tenant data isolation is maintained: `runInTenantContext(tenantId)` wraps the query, ensuring RLS still filters to the requested tenant's listings only.

### Relevance score

```sql
(1 - (embedding <=> $query_vector::vector))::float AS "relevanceScore"
```

Value in `[0, 1]` — higher is more similar. Frontend can threshold at `0.5` to hide irrelevant results.

### Feature flag

```bash
ENABLE_SEMANTIC_SEARCH=false   # default — returns mock results
ENABLE_SEMANTIC_SEARCH=true    # real embedding + pgvector query
```

`OPENAI_API_KEY` required when enabled. `OPENAI_EMBEDDING_MODEL` overrides the model (default: `text-embedding-3-small`).

---

## Cost notes

| Metric | Estimate |
| ------ | -------- |
| Model | `text-embedding-3-small` |
| Cost | $0.02 / 1M tokens |
| Tokens per property | ~100–200 (title + desc + city + type) |
| Cost per property embedded | ~$0.000002–$0.000004 |
| 10 000 properties | ~$0.02–$0.04 total |
| Per search query | ~$0.000002 (query text only) |
| 100 000 searches/month | ~$0.20 |

Embedding is done once per property publish, not on every search. Search cost is query-embedding only.

---

## Consequences

### Positive

- Natural language queries return relevant results even without keyword overlap
- Hybrid SQL + vector filters avoid "semantic hallucination" (wrong city, wrong price band)
- Public endpoint supports SEO marketplace without requiring login
- pgvector is first-party on Neon — no separate vector DB service

### Negative / follow-ups

- Properties published before Day 29 have `embedding = NULL` — backfill required for production
- ivfflat index requires `ANALYZE` after bulk insert for accurate recall; HNSW is more accurate but slower to build (consider migration to HNSW at 100K+ listings)
- Cold BullMQ worker startup (Redis unavailable) returns 503 on publish — embedding is deferred, not blocking
- `ENABLE_SEMANTIC_SEARCH=false` mock path doesn't exercise the `runInTenantContext` + pgvector code path in CI

---

## References

- `packages/db/src/schema/vector.ts` — `vector1536` Drizzle custom type
- `packages/db/drizzle/0008_property_embeddings.sql` — migration
- `packages/shared/src/ai/generate-embedding-job.ts` — BullMQ job schema
- `apps/api/src/modules/ai/generate-property-embedding.ts` — OpenAI embed call
- `apps/api/src/modules/ai/workers/generate-property-embedding-worker.ts` — BullMQ worker
- `apps/api/src/modules/search/queries/semantic-property-search.ts` — pgvector query
- `apps/api/src/modules/search/routes.ts` — public `GET /search/semantic`
- `packages/shared/src/search/semantic-search.ts` — Zod schemas
- [ADR 001 — RLS multi-tenancy](./001-rls-multi-tenancy.md) — tenant isolation in search
- [ADR 006 — AI vision](./006-ai-vision-listings.md)
