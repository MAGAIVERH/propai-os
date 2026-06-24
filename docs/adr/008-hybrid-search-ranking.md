# ADR 008: Hybrid search ranking

**Status:** Accepted
**Date:** 2026-06-24
**Context:** Phase 5 Day 52 — pure pgvector cosine distance (ADR 007) ranks by semantic similarity alone. A real marketplace must also reward listings that fit the buyer's budget, sit in the dominant search area, and are fresh on the market. We want a product-level ranking, not just a vector or SQL sort.

> The Phase 5 guide refers to this document as `004-search-ranking.md`. ADR 004 was already taken by the properties schema, so the search-ranking ADR was filed under the next free number (008). Content is unchanged.

---

## Decision

`GET /search/semantic` fetches a **candidate pool** from pgvector (up to `limit × 3`, capped at 50), then re-ranks the candidates with a weighted composite score before returning the top `limit`.

### Composite score

```
hybrid = 0.40 · semantic
       + 0.20 · price
       + 0.20 · distance
       + 0.20 · recency
```

All sub-scores are normalized to `[0, 1]`; the composite is clamped to `[0, 1]` and exposed to clients as `relevanceScore`. The raw cosine similarity is also returned as `semanticScore` for transparency/debugging.

| Signal | Weight | How it is computed |
| --- | --- | --- |
| **Semantic** | 40% | `1 − cosineDistance(queryEmbedding, propertyEmbedding)` from pgvector (`<=>`). The strongest single signal. |
| **Price** | 20% | If the query carries a price range, a listing inside the range scores ~1.0 (slightly favoring the cheaper end); outside the range it decays with relative overshoot. With no price bounds, a neutral 0.7. |
| **Distance** | 20% | Geographic centrality: distance from the **median lat/lng of the candidate set**, normalized by the set's spread. Rewards the dominant cluster (e.g. a city center) without needing an explicit search coordinate. Listings without coordinates get a neutral 0.5. |
| **Recency** | 20% | Exponential decay on `created_at` with a 30-day half-life: `0.5 ^ (ageDays / 30)`. |

### Sort options

The API accepts `sort=relevance | price_asc | newest` (default `relevance`):

- **relevance** — descending `hybrid` score (the default product ranking).
- **price_asc** — ascending price.
- **newest** — descending `created_at`.

Sorting is applied to the re-ranked candidate pool, then sliced to `limit`.

### Why re-rank a candidate pool instead of scoring in SQL?

- Distance-from-centroid needs the whole result set, which isn't known until the vector query returns.
- Keeps the pgvector query simple and index-friendly (it still does the heavy semantic ordering).
- The pool is small (≤50), so in-memory scoring is negligible.

---

## Implementation

- `apps/api/src/modules/search/queries/hybrid-rank.ts` — `rankSearchResults()` and `sortRankedRows()` (pure functions, unit-tested in `hybrid-rank.test.ts`).
- `apps/api/src/modules/search/queries/semantic-property-search.ts` — returns `created_at` and a wider candidate pool.
- `apps/api/src/modules/search/routes.ts` — orchestrates fetch → rank → sort → slice.
- Shared contract: `packages/shared/src/search/semantic-search.ts` adds `sort`, `semanticScore`, and `createdAt`.

## Consequences

- **Positive:** rankings feel sensible for budget- and location-aware queries; sort options give users control; weights are centralized and easy to tune.
- **Trade-off:** the distance signal is a heuristic (centroid proximity) rather than true distance to a searched location. A future iteration could geocode the query string for a precise origin.
- **Tuning:** weights live in `RANK_WEIGHTS`; the recency half-life and price curve are single constants. Adjust with the unit tests as a guard.
