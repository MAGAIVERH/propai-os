# Phase 3 — Day 32 Manual QA Guide

**Feature:** `POST /v1/ai/score-lead` — AI lead scoring (0–100, hot/warm/cold).

**Branch:** `feat/phase-3-ai-module`

---

## Prerequisites

```bash
# Start API
pnpm --filter @propai/api dev

# You need an active property UUID — get one from the DB or from /v1/properties
```

---

## Path 1 — Mock mode (flag off, no API key required)

```env
ENABLE_AI_SCORING=false
```

**Request:**

```http
POST http://localhost:3333/v1/ai/score-lead
Cookie: <session-cookie>
Content-Type: application/json

{
  "leadData": {
    "firstName": "Sarah",
    "lastName": "Thompson",
    "email": "sarah.t@example.com",
    "phone": "(512) 555-9012",
    "source": "marketplace",
    "message": "I need to relocate to Austin by end of next month for a new job. This property looks perfect.",
    "budgetUsdCents": 64000000
  },
  "propertyId": "<active-property-uuid>"
}
```

**Expected response (200):**

```json
{
  "score": 72,
  "priority": "warm",
  "reasoning": "Lead shows clear purchase intent with an urgent relocation timeline. Budget aligns well with the listing price."
}
```

---

## Path 2 — Real mode (flag on, OPENAI_API_KEY required)

```env
ENABLE_AI_SCORING=true
OPENAI_API_KEY=sk-...
# OPENAI_SCORING_MODEL=gpt-4o-mini   (default)
```

Use the same request body. The response will vary based on LLM output but must match:

```json
{
  "score": <integer 0–100>,
  "priority": "hot" | "warm" | "cold",
  "reasoning": "<1-2 sentence string>"
}
```

**Priority thresholds:**
- `hot`: score ≥ 70
- `warm`: score 40–69
- `cold`: score 0–39

---

## Edge case tests

### Missing propertyId → 400

```json
{ "leadData": { "firstName": "John", "lastName": "Doe", "email": "j@example.com" } }
```

Expected: `400 Bad Request` with Zod validation error.

### Invalid email → 400

```json
{
  "leadData": { "firstName": "John", "lastName": "Doe", "email": "not-an-email" },
  "propertyId": "<uuid>"
}
```

Expected: `400 Bad Request`.

### Non-existent propertyId → 404

```json
{
  "leadData": { "firstName": "John", "lastName": "Doe", "email": "j@example.com" },
  "propertyId": "00000000-0000-0000-0000-000000000000"
}
```

Expected: `404 Not Found`.

### No session → 401

Call without `Cookie` header. Expected: `401 Unauthorized`.

### Flag on, no OPENAI_API_KEY → 503

```env
ENABLE_AI_SCORING=true
# OPENAI_API_KEY not set
```

Expected: `503 Service Unavailable`.

---

## Score interpretation examples

| Lead scenario | Expected score range | Priority |
|---------------|----------------------|----------|
| Urgent relocation, budget matches | 80–95 | hot |
| Interested, no timeline, budget slightly low | 45–65 | warm |
| Generic inquiry, no message, no budget | 10–30 | cold |

---

## Note: Score persistence

Score storage ("store score on lead record") is wired in **Day 36** when the `leads` table and CRM module are created. The `POST /v1/ai/score-lead` endpoint is designed to be called internally from the leads module without breaking API changes.
