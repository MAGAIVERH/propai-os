# Dashboard revamp — overview, pipeline, properties, visits

**Delivery note** for the senior-level dashboard pass. Turns the placeholder
dashboard into a data-rich, premium workspace and fixes core layout issues.
Product language: en-US.

---

## What shipped

### 1 — Overview home (`/dashboard`)
Replaced the empty "No activity yet" placeholder with a real overview
(`modules/dashboard/components/dashboard-overview.tsx`):
- Greeting header (name + date) + range selector (7d/30d/90d) + "Add property".
- 4 KPIs via a reusable **`components/stat-card.tsx`** (Total leads, Conversion,
  Active listings, Property views), reading the existing analytics API.
- Pipeline funnel + property-views charts (reusing the analytics chart components).
- Recent leads list (AI score, time, agent) and a side panel (this-period stats +
  quick actions). GSAP stagger-in; reduced-motion safe.

### 2 — No horizontal page scroll
`SidebarInset` and the dashboard content wrapper gained `min-w-0`, so wide content
(the Kanban) scrolls inside its own container instead of stretching the whole page.

### 3 — Leads pipeline (`/leads`)
- Kanban columns are now `flex-1` (share the width) — all stages fit with **no
  horizontal scroll** on desktop.
- Premium lanes (count pill, subtle empty state) and cards (colored AI score,
  relative time, agent initials, hover lift). Drag-and-drop + GSAP Flip intact.

### 4 — Properties thumbnails
`components/property-thumb.tsx` resolves each listing's primary photo via a
presigned download URL; shown in the properties table (desktop) and cards (mobile).

### 5 — Visits (`/visits`) — new feature
There was no visits table, so this reads scheduled showings from `visit_scheduled`
lead activities:
- API: `GET /v1/visits` (crm routes) — joins activity → lead → property, RLS-scoped.
- Shared: `visitListItemSchema` / `visitListResponseSchema`.
- Web: `modules/visits/*` — a premium agenda list (date badge, lead + property
  links, note, agent).

> Follow-up: a proper `visits` table (structured `scheduled_at`) is planned so the
> agenda can sort by the actual showing date/time rather than when it was logged.

---

## Demo data (magaiver test tenant)

Two idempotent seed scripts populate an existing tenant so every screen/chart has
content (default target = the "magaiver test" tenant; override with
`SEED_TENANT_ID` / `SEED_OWNER_ID`):

- `apps/api/scripts/seed-magaiver.ts` — 8 properties (photos uploaded to MinIO via
  the real object-key format), 14 leads across stages, activities, ~215 views.
- `apps/api/scripts/seed-magaiver-enrich.ts` — a 2nd agent (leaderboard), backdated
  won leads (avg days-to-close), and this-week visits.

Data lives in named Docker volumes (`propai_postgres_data`, `propai_minio_data`) and
**persists** across `docker compose up/down` — only `down -v` wipes it. `docker:up`
now includes `--profile storage` so MinIO (property photos) starts by default.

---

## Verification
- `pnpm tsc` (web + api) clean; `pnpm lint` (web + api) clean.
- Routes compile; `GET /v1/visits` returns 401 unauthenticated (registered).

*Delivery note for Magaiver — dashboard revamp.*
