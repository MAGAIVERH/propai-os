# Phase 5 · Day 48 — Property detail page

> A public listing page that converts visitors into leads: gallery, key facts,
> features, map, rich SEO/social markup, and the "Request a showing" CTA.

## Tasks

- [x] **T1** — `GET /public/properties/:id` extended
  - Now returns `{ property, images[], features[] }`. Images resolve to public URLs via `buildPublicImageUrl` (`S3_PUBLIC_BASE_URL` or `${S3_ENDPOINT}/${S3_BUCKET}/${key}`); listings with no photos return an empty array.
  - Shared contract: `publicPropertyDetailResponseSchema` in `packages/shared`.

- [x] **T2** — `src/app/properties/[id]/page.tsx`
  - Gallery, type/listing badges, price, fact grid (beds/baths/sqft/year), description, features, map, breadcrumb.

- [x] **T3** — `src/components/property-gallery.tsx` (client)
  - Main photo + thumbnail strip; graceful typed placeholder when there are no images.

- [x] **T4** — JSON-LD `RealEstateListing`
  - `<script type="application/ld+json">` with offer/price, postal address, beds/baths, floor size, images.

- [x] **T5** — Open Graph + Twitter
  - `generateMetadata` emits OG/Twitter tags; uses the primary photo as the social image when present (`summary_large_image`).

- [x] **T6** — Location map
  - `src/components/leaflet-map.tsx` single-pin map (see Day 51). Falls back to a notice when the listing has no coordinates.

## Done

Sharing a listing link yields a rich preview; the page validates as a `RealEstateListing`; the CTA opens the lead form.
