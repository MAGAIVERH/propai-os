# Phase 7 · Day 71 — US localization pass

**Objective:** Every format feels American; zero non-English strings.

## What was done

- **Locale fix** — `lead-detail-content.tsx` was formatting dates with the
  `pt-BR` locale. Changed to `en-US` (e.g. "Jun 25, 2026, 3:30 PM").
- **Explicit en-US** — marketplace `sqFt.toLocaleString()` calls now pass
  `"en-US"` so square-footage formatting is deterministic regardless of runtime
  locale (property detail, property card, search result card).
- **Phone mask** — new `lib/format.ts` with `formatUsPhone()` formatting input as
  `(555) 123-4567` (drops a leading country-code `1`, ignores non-digits). Wired
  into the New Lead form's phone field with `inputMode="tel"` and `autoComplete`.
  Also added `formatUsDate` and `formatUsdFromCents` helpers for reuse.
- **English-only** — translated the remaining Portuguese comments in
  `apps/web/next.config.ts` to English.

## Scan results

- Repo-wide scan for Portuguese / `pt-BR` / `BRL` / `R$` across `apps/**` and
  `packages/**` source: **no UI strings** remain. The only accented match is the
  person name "João" in a CRM integration test (valid US resident name, not a
  UI string).
- USD everywhere; sq ft (never m²).

## How to test

1. Open a lead detail → timestamps render in US format.
2. New Lead → type digits in Phone → auto-formats to `(555) 123-4567`.
3. Marketplace listing → "Sq Ft" shows thousands separators (`1,842`).
