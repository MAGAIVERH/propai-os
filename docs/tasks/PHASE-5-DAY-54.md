# Phase 5 · Day 54 — Fair Housing and legal pages

> US compliance visible across the public site.

## Tasks

- [x] **T1** — Fair Housing disclaimer in the footer (`site-footer.tsx`)
  - Equal Housing Opportunity mark + the standard non-discrimination statement, on every page via the root layout.

- [x] **T2** — `/privacy` and `/terms`
  - `src/components/legal-page.tsx` shared layout; `privacy/page.tsx` (collection, use, cookies, retention, rights) and `terms/page.tsx` (use, listing accuracy, Fair Housing, no-agency, liability). Linked from the footer.

- [x] **T3** — Cookie notice
  - `src/components/cookie-notice.tsx`: dismissible banner (Accept / Decline) persisted in `localStorage`; links to the Privacy Policy. Rendered globally from the layout.

## Done

Every public page carries the Fair Housing footer; `/privacy` and `/terms` exist and are linked; first-time visitors see the cookie notice.
