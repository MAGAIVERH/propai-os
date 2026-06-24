# Phase 5 · Day 50 — Semantic search UI

> Natural-language search for buyers/renters, on top of the existing
> `GET /search/semantic` (ADR 007) and the new hybrid ranking (ADR 008).

## Tasks

- [x] **T1** — `src/components/search-bar.tsx` (client)
  - Pill-shaped input ("Describe your ideal home…") + example chips ("Quiet area near parks, pet friendly, under $500k"). Navigates to `/search?q=…`. Reused on the home hero.

- [x] **T2** — `src/app/search/page.tsx` (SSR)
  - Reads `q` + `sort`; calls the API via `fetchSemanticSearch`. States: empty (suggestions), results, no-matches, and **service unavailable**.

- [x] **T3** — `src/lib/api.ts#fetchSemanticSearch`
  - Returns a discriminated outcome `{ ok | unavailable | error }`. A `503` (flag/provider off) renders a graceful "AI search is warming up → browse all listings" panel rather than an error.

- [x] **T4** — `src/components/search-result-card.tsx`
  - Result card with a "NN% match" relevance chip (from the hybrid `relevanceScore`).

- [x] **T5** — `src/components/sort-select.tsx` (client)
  - Best match / Price low→high / Newest, bound to the `sort` URL param.

## Done

A natural-language query returns sensible US properties with relevance scores; with the flag off, the page degrades to a browse CTA instead of breaking.

See `PHASE-5-DAY-50-MANUAL.md` (requires `ENABLE_SEMANTIC_SEARCH=true` + `OPENAI_API_KEY` + embedded listings).
