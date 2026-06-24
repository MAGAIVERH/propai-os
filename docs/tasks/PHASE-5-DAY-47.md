# Phase 5 · Day 47 — Public property listing (SSR)

> SEO-friendly, filterable grid at `/properties`. Filters live in the URL so
> deep links are shareable and Google-able.

## Tasks

- [x] **T1** — `GET /public/properties` (already shipped Day 42) reused; cursor pagination + filters (`city`, `state`, `type`, `rentOrSale`, `beds`, `minPriceUsdCents`, `maxPriceUsdCents`).

- [x] **T2** — `src/app/properties/page.tsx` (SSR)
  - Reads `searchParams`, converts dollar inputs → cents, fetches the first page server-side.
  - `generateMetadata` builds a descriptive title from the active filters (e.g. "Browse 2+ bed condos in Austin, TX").

- [x] **T3** — `src/components/property-filters.tsx` (client)
  - City, state, listing (buy/rent), type, beds, min/max price; pushes to `/properties?…` (URL-bound). Render-time sync with the URL for back/forward + reset.

- [x] **T4** — `src/components/property-card.tsx`
  - Reusable card: image/placeholder, for-sale/rent badge, price, title, city/zip, beds/baths/sqft.

- [x] **T5** — `src/components/listing-grid.tsx` (client)
  - Renders the SSR first page and appends subsequent pages via a "Load more" button (client fetch with the saved cursor + filters). Empty state when no matches.

- [x] **T6** — `src/lib/property-query.ts`
  - Shared `buildApiQuery` / `describeFilters` used by the list and map pages.

## Done

`/properties?city=Austin&beds=2&rentOrSale=sale` renders a filtered SSR grid with a meaningful `<title>`; "Load more" paginates.
