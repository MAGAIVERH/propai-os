# Phase 8 · Day 83 — Marketplace app removal + mobile-responsive landing

## Goal

Make the public site genuinely great on phones and tablets, and remove a
stray app that was never part of the product surface the team works on.

The team's "marketplace / brokerage site" **is** `apps/web` (the `(marketing)`
route group on `:3000`). The separate `apps/marketplace` Next.js app (`:3001`)
was unused and confusing, so it was deleted; then the landing site got a focused
mobile pass.

## 1 — Remove the unused `apps/marketplace` app (PR #52)

Deleted the standalone public-listings app. It was a **leaf** app — nothing
imported `@propai/marketplace`, and there were no references in
`.github/workflows/ci.yml`, Railway deploy configs, or `pnpm-workspace.yaml`
(which globs `apps/*`). Shared code was **kept** (`packages/shared/marketplace`,
the API `/public` routes, and `apps/web`'s listings), since those still power the
web app.

Verified safe: `pnpm install --frozen-lockfile` ✅, `turbo typecheck` 5/5 ✅,
`pnpm lint` ✅, `apps/web` still serves `200` on `:3000`. `apps/` now holds only
`api` + `web`.

## 2 — Mobile-responsive landing fixes (PR #53)

Focused fixes from a device review (390 / 768 px), all `sm:`-gated so desktop is
untouched:

| Area | Fix |
|------|-----|
| **Hero image** | Swapped to a portrait-oriented photo (`listing-14`) on phones so `object-cover` fills the tall viewport with no crop-zoom or letterboxing; the wide shot (`listing-17`) stays on `sm+`. |
| **Hero copy** | Headline + subline switch to near-black on phones (legible over the bright photo); dropped lower (`mt-[16vh]`) so text + buttons sit over the mist band. |
| **Hero ↔ CTA swap** | The closing CTA band ("Run your brokerage on PropAI") now uses the wide `listing-17` on phones — the two photos are swapped only on mobile. |
| **Stats band** | New `StatCounter` client component: figures perpetually count up from zero (eased), hold, and loop. Static/final under reduced-motion; pauses on hidden tab. |
| **"How it works"** | Intro block (eyebrow, heading, copy, CTA) centered on mobile; left-aligned + sticky from `lg` up. |
| **FAQ** | Reduced the top padding and image→content gap on mobile. |
| **Footer** | Centered on mobile (brand, newsletter, bottom bar) with Explore / Company / Legal as three centered columns; dissolves into the 4-column desktop layout via `lg:contents`. |
| **Markets** | "Explore by market" hover accordion verified on desktop (hovered card grows to ~557px, neighbours shrink to ~162px) — no change needed. |

## Verification

- Playwright screenshots at 390 / 420 / 768 px; **no horizontal overflow** on any
  landing page.
- Stat counter sampled live: `$0.4B → … → $2.4B` looping (and the sibling
  figures in sync).
- `pnpm --filter @propai/web lint` + `typecheck` clean (one pre-existing,
  unrelated `react-hooks/incompatible-library` warning).
- Both PRs merged to `main` with all CI checks green (API tests, Docker build,
  Lint & typecheck, Web build).

## Ops note

Windows background dev servers can orphan and keep holding `:3000` / `:3333`
(→ `EADDRINUSE`); that's not a code bug — `taskkill` the PID from `netstat` and
restart. Prefer running `pnpm dev` in your own terminal while reviewing.
