# Phase 7 · Day 69 — Dashboard microinteractions

**Objective:** Polish the authenticated dashboard beyond the landing page.

## What was built

- **Page transitions** — `components/page-transition.tsx` wraps dashboard content
  and re-keys on `pathname` for a subtle fade + rise on every navigation
  (`animate-in fade-in slide-in-from-bottom-1`). Wired into `(dashboard)/layout.tsx`.
- **Route-level skeletons** — `(dashboard)/loading.tsx` shows an instant skeleton
  (header + KPI cards + panel) while a dashboard segment renders, on top of the
  existing component-level skeletons (13 already in use).
- **Empty states with CTA** — `EmptyState` now accepts an optional `action`. The
  Properties empty state shows an **Add property** button → `/properties/new`.
- **Toast consistency** — audited: only `toast.success` / `toast.error` are used
  across the app (no ad-hoc variants).

## How to test

1. `pnpm dev`, sign in, navigate between dashboard sections → content fades in;
   a skeleton flashes on slower loads.
2. Visit Properties with no listings → empty state shows the **Add property** CTA.

## Notes

- All motion is disabled under `prefers-reduced-motion` (global rule, see Day 70).
