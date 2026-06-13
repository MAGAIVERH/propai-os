# Phase 3 — Day 33: Price estimator v1 — Manual QA guide

**When to run:** After deploying Day 33 with `ENABLE_AI_PRICING=true` and a valid `OPENAI_API_KEY`.

**Prerequisite:** At least one active property exists in the test tenant (Austin, TX recommended).

---

## Environment setup

```bash
# .env (local or staging)
ENABLE_AI_PRICING=true
OPENAI_API_KEY=sk-...
# OPENAI_PRICING_MODEL=gpt-4o-mini   ← optional override
```

---

## Test A — Mock mode (flag off)

```bash
ENABLE_AI_PRICING=false  # in .env
```

1. Open the property create or edit form
2. Fill in: City = `Austin`, State = `TX`, Sq Ft = `1800`
3. Click **Estimate price**
4. Expected: Card shows `$430,000 – $510,000` (mock values), midpoint `$470,000`
5. Click **Apply $470,000**
6. Expected: Price (USD) field updates to `470000`
7. Expected: Disclaimer "Estimate only — not an appraisal." is visible

---

## Test B — Live AI mode

```bash
ENABLE_AI_PRICING=true
```

1. Ensure at least 1 active property exists in Austin, TX with a price set
2. Open the create form, fill: Type = `Single Family`, City = `Austin`, State = `TX`, Bedrooms = `3`, Sq Ft = `1800`, Purpose = `For Sale`
3. Click **Estimate price**
4. Expected (after a few seconds): Price range returned from OpenAI
5. Expected: `comparablesCount` reflects how many active listings were found
6. Expected: Reasoning mentions Austin market or comparable count
7. Click **Apply $X** — price field fills with midpoint USD value

---

## Test C — Disabled button

1. Open the create form with ALL fields blank
2. Expected: **Estimate price** button is disabled
3. Fill only City — button still disabled
4. Fill City + State but leave Sq Ft at 0 — button still disabled
5. Fill City + State + Sq Ft (> 0) — button becomes enabled

---

## Test D — Edit mode (excludePropertyId)

1. Open an existing active property in edit mode (e.g., the Austin TX test property)
2. Click **Estimate price**
3. Expected: The current property is excluded from comparables (not compared with itself)
4. Verify in API logs or response: `comparablesCount` does not count the edited property

---

## Test E — No comparables

1. Add a brand-new market: City = `Bend`, State = `OR` (no properties in that market)
2. Click **Estimate price**
3. Expected: Response returns with `comparablesCount: 0`
4. Expected: Reasoning notes "no comparable listings found" or makes a general market estimate
5. Disclaimer still visible

---

## Test F — Re-estimate

1. Complete Test B (success state)
2. Change **Sq Ft** on the form
3. Click **Re-estimate**
4. Expected: Widget calls API again and updates the price range

---

## Checklist

- [ ] Mock response returns instantly when `ENABLE_AI_PRICING=false`
- [ ] Live AI returns a valid price range with reasoning
- [ ] "Apply $X" fills the price field correctly
- [ ] Button disabled until city + state + sqFt are filled
- [ ] Edit mode excludes the current property from comparables
- [ ] No-comparables case handled gracefully (no 500 error)
- [ ] Disclaimer "Estimate only — not an appraisal." always shown on success
