# Visits table + marketplace interconnection

**Delivery note.** Adds a structured `visits` table (real showing date/time) and
wires the public marketplace to a brokerage tenant so the full loop works.

---

## 1 — Structured visits table

Previously visits only existed as `visit_scheduled` lead activities (date in
free text). Now there's a real table:

- **Schema**: `packages/db/src/schema/crm.ts` — `visits` (id, tenant_id, lead_id,
  property_id, agent_id, `scheduled_at` timestamptz, timezone, `status` enum
  `scheduled|completed|canceled`, notes, timestamps). RLS tenant-isolation.
- **Migration**: hand-written `drizzle/0013_visits.sql` (+ journal entry) — the
  drizzle-kit generator prompts interactively here (incomplete snapshots), so
  migrations are authored by hand, matching the existing 0012 pattern. Apply with
  an explicit local `DATABASE_URL` (the shell may shadow it with Neon).
- **API**: `POST /leads/:id/schedule-visit` now inserts a `visits` row (keeping
  the activity for the timeline); `GET /v1/visits` reads the table, sorted by
  `scheduled_at`.
- **Shared**: `visitListItemSchema` gains `scheduledAt`, `timezone`, `status`,
  `notes`; `visitStatusSchema`.
- **Web**: `/visits` splits into **Upcoming** and **Past** with real date/time.

## 2 — Marketplace ↔ brokerage interconnection

The public marketplace is single-tenant per deploy, resolved by
`NEXT_PUBLIC_MARKETPLACE_TENANT_ID`.

- `apps/marketplace/next.config.ts` now loads the monorepo `.env` and exposes the
  `NEXT_PUBLIC_*` vars (mirrors `apps/web`), so the tenant id actually reaches the
  app. Documented in `.env.example`.
- Verified end to end: `GET /public/properties?tenantId=…` returns the brokerage's
  active listings, and `POST /public/leads` creates a lead in that brokerage's CRM
  (marketplace interest → dashboard Kanban).

To point the marketplace at a brokerage, set `NEXT_PUBLIC_MARKETPLACE_TENANT_ID`
to its organization id and run `pnpm dev:all` (marketplace on :3001).

## Verification
- `tsc` (web + api + marketplace) and `eslint` clean.
- `visits` table created with RLS; 6 demo visits seeded; `/v1/visits` returns 401
  unauthenticated (registered).

*Delivery note for Magaiver.*
