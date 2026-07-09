# Phase 8 · Day 82 — Unit tests for core pure logic

## Goal

Add fast, isolated **unit tests** for pure business logic that previously had
only indirect (integration) coverage. Unit tests run in milliseconds, need no
Postgres/Redis, and are immune to the shared-dev-DB flakiness that affects the
integration suite locally.

## What was tested

| File under test | New test | Covers |
|-----------------|----------|--------|
| `lib/organization-slug.ts` | `organization-slug.test.ts` | diacritics stripping, hyphen collapsing/trimming, empty → `brokerage` fallback, 64-char truncation |
| `lib/lead-cursor.ts` | `lead-cursor.test.ts` | encode format, encode→decode round-trip, null on malformed / empty-id / bad-timestamp / leading-separator |
| `lib/public-image-url.ts` | `public-image-url.test.ts` | explicit base URL preference, trailing-slash stripping, endpoint/bucket fallback, null when unconfigured |
| `lib/auth-http-error.ts` | `auth-http-error.test.ts` | status normalization (numeric / `UNPROCESSABLE_ENTITY` / out-of-range → 500), guard, message precedence, sign-up 422/409 → 409 mapping |

29 new assertions across 4 files.

## Incidental fix

`auth-http-error.ts` typed `AuthHttpError.status` as required, but `isAuthHttpError`
accepts objects carrying only `statusCode`, and `getAuthHttpErrorStatus` reads
`status ?? statusCode`. Modeled the type as a union requiring **at least one** of
`status` / `statusCode` — this matches the guard, keeps the negative narrowing in
`error-handler.ts` valid, and lets the tests exercise the statusCode-only path.

## Verification

```bash
pnpm --filter @propai/api exec vitest run src/lib/organization-slug.test.ts \
  src/lib/lead-cursor.test.ts src/lib/public-image-url.test.ts \
  src/lib/auth-http-error.test.ts     # 29/29 passed
pnpm --filter @propai/api typecheck   # clean
pnpm --filter @propai/api lint        # clean
```

`public-image-url.test.ts` snapshots and restores the S3 env vars per test so it
does not leak state into the single-process suite.
