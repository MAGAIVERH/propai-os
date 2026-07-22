# Phase 8 · Day 84 — Mobile-responsive + premium dashboard

## Goal

Make the authenticated **dashboard** (`apps/web`, the `(dashboard)` route group)
genuinely great on phones and tablets, and lift every page to a consistent
"premium dashboard" feel. Day 83 handled the public landing; this is the
internal app surface (Overview, Leads, Properties, Visits, Analytics, Settings,
Profile, and the property/lead forms + detail pages).

Worked **in parts** — each part is applied, reviewed on-device by the owner, and
only then does the next part start. Desktop must stay untouched: all fixes are
mobile-first and `sm:`/`lg:`-gated.

## Scope map (audit)

| Part | Pages | Key issue found |
|------|-------|-----------------|
| **1** | Shell (layout / header / sidebar) + **Overview** | container padding was a fixed `p-6`; header was flat/non-sticky |
| **2** | **Leads / Kanban** | columns use `flex-1` and split width equally → 5 stages unusable < 768px |
| **3** | **Properties** (metrics + list) | list already has a table↔cards split; polish metrics/filters |
| **4** | **Visits + Analytics** | export/tabs row can overflow; agent leaderboard |
| **5** | **Settings, Profile, forms** (new/edit property, lead detail) | forms + sub-navs |

Already-good baseline (no change needed): sidebar collapses to a Sheet drawer
below 768px (`use-mobile`, `MOBILE_BREAKPOINT = 768`); `StatCard` is already a
premium KPI tile; `PropertiesList` already renders `PropertiesTable` on `md+`
and `PropertiesCards` on mobile.

## Part 1 — Shell + Overview ✅ (applied, in review)

- **`(dashboard)/layout.tsx`** — content container padding is now responsive:
  `p-4 sm:p-6 lg:p-8` (was a flat `p-6`) with a tighter `gap-5` on mobile. Gives
  phones more usable width and scales up cleanly on large screens.
- **`dashboard-header.tsx`** — header is now **sticky** (`sticky top-0 z-20`)
  with a translucent `backdrop-blur` so it stays accessible while scrolling (a
  premium touch and better mobile ergonomics). Padding + action gap tighten on
  mobile (`px-3 sm:px-4`, `gap-1 sm:gap-2`).
- **`dashboard-overview.tsx`** — the greeting's controls row (period Tabs + "Add
  property") now spans the full width on mobile with tabs left / button right
  (`w-full justify-between sm:w-auto sm:justify-end`), instead of wrapping
  awkwardly under the greeting.

### Part 1 refinements — mobile drawer UX (from device review)

The mobile sidebar is a Sheet drawer whose built-in close `X` is hidden
(`[&>button]:hidden`), so it could only be dismissed by tapping the overlay.
Fixed in `app-sidebar.tsx`:

- **Close control inside the drawer** — a `PanelLeft` ghost button in the sidebar
  header, `md:hidden` (desktop keeps the header trigger). Mirrors the icon that
  opens it.
- **Auto-close on navigation** — every nav item (and the logo) now calls
  `setOpenMobile(false)` via `useSidebar()`, so tapping a destination closes the
  drawer instead of leaving it open over the new page.

## Part 2 — Leads / Kanban ✅ (applied, in review)

The board packed all pipeline stages into equal `flex-1` columns, so on a phone
6 stages collapsed into unreadable ~40px strips (see device screenshot).

Reworked in `kanban-board.tsx` + `kanban-column.tsx` so stages **stack
vertically** on mobile (owner's chosen layout — cleaner than a horizontal swipe
on a phone):

- The board is `flex flex-col gap-3 lg:flex-row lg:items-stretch` — a vertical
  stack that scrolls naturally down the page on mobile, reverting to side-by-side
  columns from `lg` up.
- Columns are `w-full` on mobile and `lg:w-auto lg:min-w-0 lg:flex-1` (equal
  share) on desktop, so desktop is unchanged.
- The lane min-height is compact on mobile (`min-h-[7rem]`) and only tall
  (`lg:min-h-[26rem]`) when columns sit side by side — an empty stack stays tidy
  instead of a column of huge empty boxes. Same treatment on the loading
  skeleton.
- Drag-and-drop between stages is preserved.

## Part 3 — Properties list ✅ (applied, in review)

`/properties` — header + metrics + status filter + list. The list already had a
table↔cards split (`PropertiesList`: `PropertiesTable` on `md+`,
`PropertiesCards` below), so the work was on the other three blocks:

- **Status filter** (`properties-status-filter.tsx`) — was `flex flex-wrap`, so
  the `All + statuses` pills wrapped into a messy 2–3 rows on a phone. Now a
  single **horizontally scrollable pill row** on mobile (`overflow-x-auto`,
  hidden scrollbar, edge-bleed via `-mx-4 px-4`, `shrink-0` pills), reverting to
  `sm:flex-wrap` on larger screens where they all fit with no scroll.
- **Metrics** (`properties-metrics.tsx`) — was 1 column on mobile (four tall
  stacked cards). Now **2 columns on mobile** (`grid-cols-2`, `gap-3`), matching
  the analytics KPI density, then `xl:grid-cols-4`. Card padding tightens to
  `p-4 sm:p-5`; label truncates and the icon `shrink-0` so nothing overflows at
  the narrower 2-up width.
- **Table** (`properties-table.tsx`) — columns previously squeezed/wrapped in the
  768–900px range. Gave the table a `min-w-[720px]` so it keeps readable column
  widths and **scrolls horizontally** inside the Table's built-in
  `overflow-x-auto` container instead of cramming; the rounded border wrapper
  stays `overflow-hidden` for clean corners.

## Part 4 — Visits + Analytics ✅ (applied, in review)

The charts already use Recharts `ResponsiveContainer` (width 100%), so they scale
on their own. Fixes were on the surrounding chrome:

- **Analytics header** (`analytics-dashboard.tsx`) — the range Tabs + the two
  export buttons were a `flex-wrap justify-between` row that crowded / wrapped
  awkwardly on a phone. Now stacks on mobile (`flex-col`): Tabs on top, then the
  export buttons on their own full-width row with each button `flex-1` (balanced
  halves). Reverts to an inline `sm:flex-row justify-between` on desktop.
- **Agent leaderboard** (`agent-leaderboard.tsx`) — the 5-column table squeezed on
  mobile. Gave it `min-w-[460px]` so it **scrolls horizontally** inside the
  Table's built-in `overflow-x-auto` container instead of cramming the numeric
  columns.
- **Visits list** (`visits-page-content.tsx`) — light mobile spacing polish on the
  visit rows (`gap-3 p-3` on mobile → `sm:gap-4 sm:p-4`) so they breathe better on
  narrow screens. Layout was otherwise already sound.

## Part 5 — Settings, Profile, forms + detail pages ✅ (applied, in review)

Most of this surface was already responsive (audited, no change needed): Profile
(`lg:grid-cols-2` → single column, full-width inputs), Billing (usage bars +
`flex-wrap` buttons), the Team invite form (`flex-col sm:flex-row`), the Property
form (`md:grid-cols-2` sections), Lead detail (`lg:grid-cols-[280px_1fr]` → stack,
`flex-wrap` activity chips), and Property detail specs (`grid-cols-2
sm:grid-cols-4`). Targeted fixes:

- **Settings nav** (`settings-nav.tsx`) — items are now `shrink-0
  whitespace-nowrap` so the General/Team/Billing tabs never squeeze inside the
  existing `overflow-x-auto` scroller on narrow screens.
- **Team table** (`team-management.tsx`) — `min-w-[420px]` so the Member / Role
  (Select) / Actions columns scroll horizontally instead of cramping on mobile.
- **Property form** (`property-form.tsx`) — the three card sections go `p-4
  sm:p-6`, reclaiming input width on phones (the fixed `p-6` ate ~96px of a
  360px screen). Same `p-4 sm:p-6` applied to the **Property detail** summary
  card for consistency.

## Fix — post-login hangs until manual refresh

Reported: after signing in, the screen sat on a loading state and only reached
the dashboard after a manual page refresh. **Real bug, not just local hardware.**

Root cause: all three auth forms (`login-form`, `sign-up-form`,
`create-brokerage-form`) navigated with a fragile pattern —
`setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 400)`. The
dashboard is gated by `src/proxy.ts`, which on every request calls the API's
`/api/auth/get-session` with the request cookies. A **soft** client navigation
(`router.push`) into that gate — combined with an immediate `router.refresh()`
and a guessed 400 ms delay for cookie propagation — could fire the RSC request
before the just-set cookie was reliably attached, so the proxy bounced it and the
client stuck on loading. A manual refresh (a full document request that always
carries the cookie) passed the gate, which is why refreshing "fixed" it.

Fix: replace the soft navigation with a **hard navigation**
(`window.location.assign(...)`) after a successful sign-in / sign-up / org
creation. A full request guarantees the fresh cookie reaches the proxy on the
first try — no `setTimeout`, no `router.push`+`refresh` race. Login also now
honours the `?next=` deep link the proxy appends, sanitised through a new
`safeInternalPath()` helper (`modules/auth/lib/safe-redirect.ts`) that rejects
open-redirect payloads (absolute URLs, `//host`, `/\` tricks).

## Verification

- Full local stack up for review: `pnpm dev` → web `:3000` (200), api `:3333`.
- `tsc --noEmit` clean on `@propai/web` after the changes.
- Owner reviews each part on-device (logged-in session) before advancing.

## Ops note

Windows background dev servers can orphan and keep holding `:3000` / `:3333`
(→ `EADDRINUSE`); `taskkill` the PID from `netstat` and restart.
