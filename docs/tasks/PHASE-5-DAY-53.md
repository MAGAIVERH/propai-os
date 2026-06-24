# Phase 5 · Day 53 — Redis cache for popular listings

> Cache the public listing grid for a performance story, with explicit
> hit/miss visibility and correctness on inventory changes.

## Tasks

- [x] **T1** — `apps/api/src/lib/public-properties-cache.ts`
  - Key: `public:properties:{tenantId}:{variant}` where `variant` is a deterministic, sorted serialization of the query (filters + cursor + limit). TTL **5 min**.
  - `read` / `write` / `invalidate` are all best-effort and no-op when Redis is unset.

- [x] **T2** — `GET /public/properties` integration
  - On hit → `X-Cache: HIT` + cached JSON. On miss → query, cache, `X-Cache: MISS`.

- [x] **T3** — Invalidation
  - `invalidatePublicPropertiesCache(tenantId)` (SCAN + pipeline DEL) called after property **create**, **update/publish**, and **delete** in `apps/api/src/modules/properties/routes.ts`, so the public grid never serves stale inventory.

- [x] **T4** — Verified via `public-marketplace.integration.test.ts` (asserts the `X-Cache` header is present).

## Done

Repeated identical list requests return `X-Cache: HIT`; publishing/editing/deleting a property drops the cached pages.

See `PHASE-5-DAY-53-MANUAL.md` to measure before/after latency and watch HIT/MISS.
