# Phase 7 · Day 72 — Error boundaries and offline handling

**Objective:** The app fails gracefully instead of breaking ugly.

## What was built

- **Global error boundary** — `app/global-error.tsx` (self-contained `<html>/<body>`,
  no providers) with a `Try again` button using Next 16's `unstable_retry`.
- **Dashboard error boundary** — `(dashboard)/error.tsx` catches render errors in
  any dashboard segment and offers retry without a full reload.
- **404 page** — `app/not-found.tsx` with a branded, friendly message and links
  back home / to the dashboard.
- **API-down handling** — new reusable `components/error-state.tsx` (friendly
  message + retry). Wired into the Properties page: when the list query fails
  (e.g. API unreachable), an inline error with a **Try again** button calls
  `refetch()` instead of leaving an empty screen.
- **WebSocket reconnect indicator** — already present: the notification bell shows
  a live connection-status dot (`connecting` / `online` / `offline`) backed by the
  `useTenantSocket` reconnect logic; left intact and verified.

## Next 16 note

- Error boundaries receive `unstable_retry` (not the old `reset`). Used in both
  `global-error.tsx` and `(dashboard)/error.tsx`.

## How to test

1. Visit a non-existent path → branded 404 with navigation.
2. Stop the API, open Properties → inline "Couldn't load properties" with a
   working **Try again**; start the API and retry → data loads.
3. Stop/start the API while on the dashboard → bell connection dot reflects state.
