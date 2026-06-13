# AI Checklist — Phase 3 sign-off

Verification checklist for all four AI features. Run this before tagging `ai-v0.1.0`.

**Completion criteria:** every item checked, all flags tested on/off, no unhandled errors.

---

## Environment

```bash
# Local Docker running
docker compose up -d

# .env (full AI test)
ENABLE_AI_VISION=true
ENABLE_SEMANTIC_SEARCH=true
ENABLE_AI_SCORING=true
ENABLE_AI_PRICING=true
GEMINI_API_KEY=sk-...
OPENAI_API_KEY=sk-...
REDIS_BULLMQ_URL=redis://localhost:6379
```

---

## Feature 1 — Property image analysis (AI vision)

**Route:** `POST /v1/ai/analyze-property-images`  
**ADR:** [006](./adr/006-ai-vision-listings.md)

### Flag off (mock path)

- [ ] `ENABLE_AI_VISION=false` → `POST /v1/ai/analyze-property-images` returns 200 with mock analysis instantly
- [ ] No Redis connection required
- [ ] Frontend: "Apply suggestions to form" appears after mock completes
- [ ] Prefill written to sessionStorage → edit form shows AI-prefilled values with banner

### Flag on (real path)

- [ ] Upload ≥ 1 photo on a property
- [ ] Click "Analyze photos with AI" → status badge shows "Queued" then "Processing"
- [ ] Job completes within 60 s → status shows "Ready" + "Apply suggestions to form" button
- [ ] Click "Apply suggestions" → redirected to edit form with AI-prefilled fields
- [ ] AI disclaimer banner visible on edit form
- [ ] Fields have realistic values (title, description, features, type, condition)

### Failure path

- [ ] Redis unavailable → `POST` returns 503 → frontend shows "Analysis failed" Alert with manual entry hint
- [ ] Job times out (3 min) → frontend shows timeout error + manual entry hint
- [ ] "Try again" button resets widget to idle

### Rate limit

- [ ] Exceed 10 analyses in < 1 hour → `429 Too Many Requests` + `Retry-After` header
- [ ] Frontend shows error message; manual entry remains accessible

---

## Feature 2 — Semantic search

**Route:** `GET /search/semantic`  
**ADR:** [007](./adr/007-semantic-search-pgvector.md)

### Flag off (mock path)

- [ ] `ENABLE_SEMANTIC_SEARCH=false` → `GET /search/semantic?q=cozy+3bed&tenantId=...` returns 200 with mock items

### Flag on (real path)

- [ ] Publish a property (status → active) → embedding job enqueued
- [ ] BullMQ worker embeds property text via OpenAI → `properties.embedding` is non-NULL
- [ ] `GET /search/semantic?q=cozy+3bed+Austin+TX&tenantId=...` returns the embedded property in top results
- [ ] `relevanceScore` in `[0, 1]`; at least one result scores > 0.5 for a matching query
- [ ] Filters work: `&city=Austin` excludes properties from other cities

### No embedding (cold start)

- [ ] Property published before Day 29 has `embedding = NULL` → excluded from results (not an error)

### Endpoint is public (no auth)

- [ ] No session cookie → `GET /search/semantic?tenantId=...` returns 200 (not 401)

---

## Feature 3 — Lead scoring

**Route:** `POST /v1/ai/score-lead`

### Flag off (mock path)

- [ ] `ENABLE_AI_SCORING=false` → returns `{ score: 72, priority: "warm", reasoning: "..." }` (mock)

### Flag on (real path)

- [ ] `POST /v1/ai/score-lead` with valid `leadData` + existing `propertyId` → returns score 0–100, priority (hot/warm/cold), reasoning
- [ ] Score ≥ 70 → `priority: "hot"`
- [ ] Score 40–69 → `priority: "warm"`
- [ ] Score ≤ 39 → `priority: "cold"`

### Error cases

- [ ] Non-existent `propertyId` → 404
- [ ] OpenAI unavailable / not configured → 503
- [ ] LLM returns malformed JSON → 422

---

## Feature 4 — Price estimation

**Route:** `POST /v1/ai/estimate-price`

### Flag off (mock path)

- [ ] `ENABLE_AI_PRICING=false` → returns `{ minUsd: 430000, maxUsd: 510000, midpointUsd: 470000, comparablesCount: 4 }`

### Flag on (real path)

- [ ] `POST /v1/ai/estimate-price` with `{ city, state, type, bedrooms, sqFt, rentOrSale }` → returns price range
- [ ] `comparablesCount` reflects actual comparable listings in the tenant portfolio
- [ ] Price range is plausible for the market (Austin TX 3BR ~$400K–$600K)
- [ ] `excludePropertyId` prevents self-comparison in edit mode

### Frontend widget (property form)

- [ ] Widget visible in "Details" section of both create and edit property forms
- [ ] "Estimate price" button disabled until city + state + sqFt are filled
- [ ] Skeleton shows while loading
- [ ] "Apply $X" fills the price field with `midpointUsd`
- [ ] "Estimate only — not an appraisal." disclaimer always visible on success
- [ ] Error state shows "enter the price manually" hint

### Error cases

- [ ] OpenAI unavailable → 503 → widget shows error + manual entry hint
- [ ] LLM parse error → 422 → widget shows error + manual entry hint

---

## Cross-cutting checks

### Feature flags (all off)

- [ ] `ENABLE_AI_VISION=false` + `ENABLE_SEMANTIC_SEARCH=false` + `ENABLE_AI_SCORING=false` + `ENABLE_AI_PRICING=false`
- [ ] All four routes return mock/503 without touching OpenAI or Gemini
- [ ] `pnpm typecheck` passes with no AI keys set

### TypeScript

```bash
pnpm typecheck   # all 6 packages pass
```

- [ ] No type errors

### CI

- [ ] GitHub Actions CI green on `main` (typecheck + lint)

---

## Sign-off

| Item | Status |
| ---- | ------ |
| AI vision — mock path | |
| AI vision — real path | |
| AI vision — failure UX | |
| Semantic search — mock path | |
| Semantic search — real path | |
| Lead scoring — mock path | |
| Lead scoring — real path | |
| Price estimator — mock path | |
| Price estimator — real path | |
| Price estimator — widget UX | |
| `pnpm typecheck` green | |
| CI green on main | |

**Tagged:** `ai-v0.1.0` — ☐ pending / ☑ done
