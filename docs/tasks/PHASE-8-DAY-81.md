# Phase 8 · Day 81 — Security hardening (API)

## Goal

Close the gaps that matter before the API is exposed on the public internet
(Day 77 deploy). Focused, low-risk changes; no behavior change for local `pnpm dev`.

## Diagnostic (before)

| Area | State found |
|------|-------------|
| Helmet | ✅ on (HSTS, X-Frame, nosniff); CSP off — acceptable for a JSON API |
| CORS | ✅ restricted to `TRUSTED_ORIGINS` (not wildcard), credentials on |
| Cookies | ✅ `httpOnly`, `secure` in production, `sameSite: lax` |
| Public lead limit | ✅ per-IP 5 / 10 min, fails open |
| **Trusted origins** | 🔴 **hardcoded to localhost** — CORS + Better Auth reject deployed domains → login breaks in cloud |
| **Log redaction** | 🟠 none — pino would log `authorization` / `cookie` / `set-cookie` |
| **Auth rate limit** | 🟠 none — `brokerage-sign-in` had no brute-force protection |
| **Proxy awareness** | 🟠 `trustProxy` off — `request.ip` would be the proxy, not the client |
| `pnpm audit` | 🟡 8 vulns, all dev-only transitives under `better-auth` (esbuild/tsx) — documented, not force-overridden to avoid destabilizing the running app |

## Changes

1. **Env-driven trusted origins** — `lib/trusted-origins.ts` (`parseTrustedOrigins`)
   merges the localhost defaults with the comma-separated `TRUSTED_ORIGINS` env
   var, de-duplicated. Used by CORS (`app.ts`) and Better Auth (`better-auth.ts`).
   Documented in `.env.example` + `.env.staging.example`. **This also unblocks
   Day 77 deploy** (auth would otherwise reject the Railway domains).
2. **Log redaction** — `lib/logger.ts` adds pino `redact` for
   `req.headers.authorization`, `req.headers.cookie`, `res.headers["set-cookie"]`.
3. **Rate limiting** — `plugins/rate-limit.ts` registers `@fastify/rate-limit`
   (global 200/min per IP) plus a strict `AUTH_RATE_LIMIT` (10/min) on the
   sign-in / sign-up / create-organization routes. **Enabled in production/staging
   only** (`NODE_ENV=production`, or opt in with `RATE_LIMIT_ENABLED=true`) — off
   in dev + tests so local flows and the deterministic suite are unaffected.
4. **Proxy awareness** — `trustProxy` enabled in production only, so `request.ip`
   is the real client IP behind the Railway/Fly edge (used by rate limits + audit).

## Why rate limiting is gated to production

The API test suite runs single-process (`fileParallelism: false`) with a shared
in-memory limiter store; an always-on limiter rejects requests once the suite
crosses the budget. Gating on `NODE_ENV=production` keeps tests deterministic and
still protects staging (which sets `NODE_ENV=production`).

## Verification

- ✅ `pnpm --filter @propai/api typecheck` + `lint` clean
- ✅ New unit tests: `lib/trusted-origins.test.ts` (5/5)
- ⚠️ Full `test:api` locally is flaky due to a **polluted local dev DB** (shared
  with the running app); the same flakiness reproduces on clean `main` and the
  failing tests differ per run and pass in isolation. The authoritative signal is
  **CI** (fresh Postgres per run). Confirmed the affected files pass in isolation.

## New env var

`TRUSTED_ORIGINS` (comma-separated) — deployed origins that may call the API.
Required in staging/production; localhost stays trusted automatically.
