# Phase 7 · Day 75 — Polish buffer + tag

**Objective:** UI/UX sign-off for Phase 7.

## What was done

- **Next 16 deprecation fixed:** migrated `apps/web/src/middleware.ts` →
  `proxy.ts` and renamed the exported `middleware` function to `proxy` (per the
  official `middleware-to-proxy` migration). Verified the dev server now logs
  `proxy.ts` (no deprecation warning) and auth routing still works:
  `/` → 200 (landing, signed out), `/login` → 200, `/dashboard` → 307.
- **Comment cleanup:** updated stray "middleware" references in comments to "proxy".
- **Checklist:** `docs/UI-POLISH-CHECKLIST.md` — 100% for Days 66–75.

## Final verification (this branch)

- `pnpm lint` — all packages green.
- `pnpm typecheck` — all packages green.
- `pnpm test:api` — 242/242 (local Postgres).
- Landing, login, dashboard redirect, and demo seed all verified at runtime.
- CI (`feat/phase7-landing-polish`): Lint & typecheck, Web build, and API tests
  green on the first push.

## Tag

- `ui-v0.1.0`.

## Known notes

- Local Windows `next build` can fail prerendering Next's internal
  `/_global-error` (and client-form pages) — a platform prerender quirk; CI
  (Linux) `web-build` is green. Dashboard is `force-dynamic`.
- API integration suite shows occasional auth-race flakiness only when the full
  suite runs in one process; CI uses a fresh Postgres per run and individual
  files pass deterministically.
