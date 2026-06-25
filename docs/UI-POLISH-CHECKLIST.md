# UI Polish Checklist — Phase 7 (Days 66–75)

Status: ✅ complete. Tag: `ui-v0.1.0`.

## Landing page (Days 66–68)
- [x] Marketing route group with nav + footer shell (`apps/web/src/app/(marketing)`)
- [x] Sections: Hero, Features, How it works, Pricing, Testimonials, FAQ, CTA
- [x] en-US copy only; USD pricing aligned with the Free/Pro billing gates
- [x] Fair Housing (Equal Housing Opportunity) disclaimer in footer
- [x] "software, not a licensed brokerage" disclaimer
- [x] SEO metadata (title, description, Open Graph)
- [x] Root `/` serves landing for signed-out visitors; authed users → dashboard/setup

## Animations (Day 67)
- [x] Lenis smooth scroll on landing, synced with GSAP ScrollTrigger
- [x] ScrollTrigger reveal (fade + rise) on `[data-animate]`; hero parallax
- [x] All motion gated by `prefers-reduced-motion` (JS + global CSS)

## Dashboard microinteractions (Day 69)
- [x] Page-transition fade on route change
- [x] Route-level skeleton (`(dashboard)/loading.tsx`) + component skeletons
- [x] EmptyState supports a CTA; Properties empty → "Add property"
- [x] Toasts consistent (success/error only)

## Accessibility (Day 70)
- [x] Global `prefers-reduced-motion` rule
- [x] All icon buttons have aria-label / sr-only text
- [x] Semantic landing (single h1, section h2s, nav landmark, decorative aria-hidden)
- [x] Accessible FAQ via native `<details>/<summary>`
- [x] Visible focus rings (shared Button)

## US localization (Day 71)
- [x] Fixed `pt-BR` → `en-US` date locale (lead detail)
- [x] Explicit `en-US` number formatting (marketplace sq ft)
- [x] US phone mask `(555) 123-4567` (`lib/format.ts`) in New Lead form
- [x] Translated remaining Portuguese comments
- [x] Repo scan: no Portuguese/BRL UI strings remain

## Error & offline handling (Day 72)
- [x] `global-error.tsx` (self-contained, `unstable_retry`)
- [x] `(dashboard)/error.tsx` segment boundary
- [x] Branded `not-found.tsx` (404)
- [x] Reusable `ErrorState` (API-down + retry) wired into Properties
- [x] WebSocket reconnect indicator (notification bell) verified

## Demo data (Day 73)
- [x] `pnpm db:seed` → Summit Realty Group (owner + agent, 6 properties, 12 leads,
      5 notes, 3 visits) via the real API
- [x] Verified: sign-in 200; analytics totalLeads 12 / activeListings 4 / visits 3
- [x] Credentials documented (env only, not committed)

## Performance (Day 74)
- [x] Marketplace images: lazy/eager + decoding hints (LCP-friendly)
- [x] Maps lazy-load leaflet; recharts route-split (verified)
- [x] DB index `leads_tenant_agent_idx` (migration 0012)

## Polish & housekeeping (Day 75)
- [x] Migrated `middleware.ts` → `proxy.ts` (Next 16 deprecation)
- [x] `pnpm lint` (all packages) green
- [x] `pnpm typecheck` (all packages) green
- [x] `pnpm test:api` 242/242 green (local Postgres)
- [x] Git tag `ui-v0.1.0`

## Known notes
- Local Windows production build (`next build`) can fail prerendering Next's
  internal `/_global-error` and client-form pages — a platform-specific prerender
  quirk. CI (Linux) builds green (`web-build` job). Dashboard is `force-dynamic`.
- API integration suite has occasional auth-race flakiness when the whole suite
  runs; CI uses a fresh Postgres per run. Individual files pass deterministically.
