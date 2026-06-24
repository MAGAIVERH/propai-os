# Phase 5 · Day 52 — Hybrid search ranking

> Product-level ranking, not just vector or SQL. Documented in
> [ADR 008](../adr/008-hybrid-search-ranking.md).

## Tasks

- [x] **T1** — `apps/api/src/modules/search/queries/hybrid-rank.ts`
  - `rankSearchResults()` composite: **semantic 40% + price 20% + distance 20% + recency 20%** (all normalized to 0–1, clamped). `sortRankedRows()` for `relevance | price_asc | newest`.
  - Price: in-budget ≈ 1.0 (slightly favoring the cheaper end), decays outside; neutral 0.7 without bounds. Distance: proximity to the candidate-set centroid. Recency: 30-day half-life exponential decay.

- [x] **T2** — `semantic-property-search.ts` returns `created_at` and a wider candidate pool (`limit × 3`, cap 50).

- [x] **T3** — `search/routes.ts` orchestrates fetch → rank → sort → slice; response carries `semanticScore` (raw cosine) and `relevanceScore` (hybrid).

- [x] **T4** — Shared contract (`packages/shared/src/search/semantic-search.ts`): `sort` enum (`SEARCH_SORT_OPTIONS`), `semanticScore`, `createdAt`.

- [x] **T5** — `docs/adr/008-hybrid-search-ranking.md` (+ README index entry).

- [x] **T6** — `apps/api/src/modules/search/queries/hybrid-rank.test.ts` (7 tests): weights sum to 1; score in [0,1]; stronger semantic / fresher / in-budget rank higher; `price_asc` + `newest` ordering.

## Done

Unit tests confirm sensible orderings for test inputs; sort options work; weights are centralized in `RANK_WEIGHTS`.
