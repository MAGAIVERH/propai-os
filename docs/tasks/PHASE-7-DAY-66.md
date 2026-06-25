# Phase 7 · Day 66 — Landing page scaffold

**Objective:** A premium first-impression marketing landing page for PropAI OS.

## What was built

- New route group `apps/web/src/app/(marketing)` with its own shell layout
  (`marketing-nav` + `marketing-footer`) rendered full-width over the dark theme.
- Landing page at `/` (`(marketing)/page.tsx`) composing the sections:
  Hero → Features → How it works → Pricing → Testimonials → FAQ → CTA.
- Marketing module under `apps/web/src/modules/marketing`:
  - `content.ts` — single source of truth for all en-US marketing copy.
  - `components/` — `hero-section`, `features-section`, `how-it-works-section`,
    `pricing-section`, `testimonials-section`, `faq-section`, `cta-section`,
    `marketing-nav`, `marketing-footer`, `landing-animations`.
- Footer includes the **Fair Housing** Equal Housing Opportunity disclaimer and a
  "software, not a licensed brokerage" note.
- Page-level `metadata` (title, description, Open Graph) for SEO/social.

## Routing change

- Removed the old `app/page.tsx` (which redirected `/` → `/dashboard`).
- `middleware.ts`: unauthenticated visitors now see the public landing at `/`;
  authenticated users are still redirected to `/dashboard` (active) or `/setup`
  (no org).

## How to test

1. `pnpm dev` (web on :3000, api on :3333) with Docker stack up.
2. Visit `http://localhost:3000/` while signed out → landing renders with all
   sections, nav, and footer.
3. Click **Start free** → `/signup`; **Sign in** → `/login`.
4. Sign in → `/` redirects to `/dashboard`.

## Notes

- Content is SSR (server components) for SEO; only `landing-animations` is a
  client component (see Day 67).
- en-US copy only; USD pricing; Fair Housing disclaimer present.
