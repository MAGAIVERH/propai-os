# Phase 5 · Day 51 — Map view with clusters

> Geo browsing at `/properties/map`: clustered pins, list ↔ map selection sync,
> US-centered default.

## Tasks

- [x] **T1** — Leaflet deps
  - `leaflet`, `leaflet.markercluster` (+ types) added to `apps/marketplace`.

- [x] **T2** — `src/components/leaflet-map.tsx` (client)
  - Dynamically imports `leaflet` (and the cluster plugin) inside `useEffect` so it never runs during SSR. Dark CARTO basemap, custom emerald `divIcon` dots (no broken default-marker assets), `fitBounds` to the result set, popups with price + title. `onSelect(id)` for list/map sync; tears the map down on unmount.

- [x] **T3** — `src/app/properties/map/page.tsx` (SSR)
  - Reuses `buildApiQuery` (limit 50). Renders `<PropertyFilters basePath="/properties/map">` + `<MapExplorer>`. Filter changes re-run the SSR fetch, updating map **and** list together.

- [x] **T4** — `src/components/map-explorer.tsx` (client)
  - Clustered map + scrollable list; selecting a list item highlights its pin and vice-versa; a floating preview card links through to the detail page. Empty state when no listing has coordinates.

- [x] **T5** — `PropertyFilters` gains a `basePath` prop so the same component drives both the list and map routes.

## Done

The map clusters pins, recenters to the active filters, and stays in sync with the list; clicking a pin shows a preview card.
