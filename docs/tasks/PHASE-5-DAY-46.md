# Phase 5 · Day 46 — Marketplace app scaffold

> Public, SEO-first Next.js app (`apps/marketplace`, port 3001). No auth to browse.
> Shared chrome (header + footer), US-English metadata defaults, and the route
> skeleton for the rest of Phase 5.

## Tasks

- [x] **T1** — `src/app/layout.tsx`
  - Inter via `next/font/google` (`--font-inter`); `<SiteHeader>`, `<SiteFooter>`, `<CookieNotice>` around the page.
  - Metadata defaults: title template `%s · PropAI OS`, description, keywords, Open Graph (`en_US`), Twitter card.

- [x] **T2** — `src/components/site-header.tsx`
  - Sticky, blurred header with the PropAI wordmark and nav: Browse, Map, AI Search, About, Contact.

- [x] **T3** — `src/components/site-footer.tsx`
  - Four-column footer (Explore / Company / Legal) + Fair Housing disclaimer block (see Day 54).

- [x] **T4** — Route skeleton + design tokens
  - `/` (hero + featured), `/properties`, `/properties/map`, `/properties/[id]`, `/search`, `/about`, `/contact`, `/privacy`, `/terms`.
  - `globals.css` refreshed: emerald brand accent, card/muted/border tokens, hero glow, dark Leaflet styles.

- [x] **T5** — `src/app/about/page.tsx`, `src/app/contact/page.tsx`
  - Static content pages with per-page metadata.

## Done

`pnpm --filter @propai/marketplace dev` serves the marketplace on `localhost:3001`; `build` produces all 10 routes. Header/footer render on every page.
