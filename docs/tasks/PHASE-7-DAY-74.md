# Phase 7 · Day 74 — Performance optimization

**Objective:** Faster pages and a Lighthouse-friendly marketplace.

## What was done

### Images (marketplace)
- Property **detail gallery**: the main image now uses `fetchPriority="high"` +
  `decoding="async"` (it's the LCP element); thumbnails use `loading="lazy"` +
  `decoding="async"`.
- Property **card** grid images use `loading="lazy"` + `decoding="async"` so
  off-screen listings don't block the initial render.
- Note: listing images are short-lived **presigned** URLs, so `next/image`
  optimization (which caches by URL) isn't a good fit; native lazy/priority hints
  are the pragmatic win.

### Code splitting (already in place — verified)
- **Maps**: `leaflet` and `leaflet.markercluster` are imported lazily inside a
  `useEffect` in the client `LeafletMap` component, so the map library is never in
  the initial bundle and never runs during SSR.
- **Charts**: `recharts` lives only in the analytics chart components, which the
  App Router automatically code-splits to the `/analytics` route.

### Database
- Added index `leads_tenant_agent_idx (tenant_id, assigned_agent_id)` — the lead
  list supports filtering by assigned agent, which previously had no covering
  index. Migration `0012_leads_tenant_agent_idx.sql` (idempotent `CREATE INDEX IF
  NOT EXISTS`). Verified applied locally.
- Reviewed existing indexes: properties `(tenantId,status)` / `(tenantId,city,
  state)` / geo; leads `(tenant,stage)` / `(tenant,email)` / `(tenant,created)`;
  activities `(lead)` / `(lead,created)`; notifications `(tenant,user,created/read)`.

## How to test

1. Marketplace property page → first photo loads eagerly, thumbnails/cards defer.
2. `EXPLAIN` a lead list filtered by `assigned_agent_id` → uses
   `leads_tenant_agent_idx`.

## Notes

- Lighthouse target (85+ on the property page) should be run against a deployed
  build; the image hints above directly improve LCP and reduce main-thread work.
