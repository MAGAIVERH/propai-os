# Phase 2 — End-to-end checklist (Days 20–25)

Use this guide to validate the **dashboard shell**, **properties module**, **create/edit forms**, and **map + photo gallery** on a fresh local environment.

**Branch:** `feat/phase-2-day-20-25`

---

## 1. One-time setup

```bash
git clone https://github.com/MAGAIVERH/propai-os.git
cd propai-os
git checkout feat/phase-2-day-20-25
pnpm install
cp .env.example .env
```

Edit `.env`:

| Variable | Example | Why |
| -------- | ------- | --- |
| `BETTER_AUTH_SECRET` | 32+ random chars | Session signing |
| `NEXT_PUBLIC_MAP_PROVIDER` | `osm` | Map on property detail (no API key needed) |
| `S3_ENDPOINT` | `http://localhost:9000` | Photo uploads (MinIO) |
| `S3_ACCESS_KEY_ID` | `minioadmin` | MinIO default |
| `S3_SECRET_ACCESS_KEY` | `minioadmin` | MinIO default |

Start infrastructure:

```bash
pnpm docker:up
docker compose --profile storage up -d   # MinIO for photo uploads
pnpm db:migrate
pnpm dev
```

Smoke checks (second terminal):

```bash
curl -s http://localhost:3333/health
pnpm --filter @propai/web typecheck
```

Open http://localhost:3000

---

## 2. Day 20 — Dashboard shell

| Step | Action | Expected |
| ---- | ------ | -------- |
| 1 | Open `/login` in incognito | Login page |
| 2 | Visit `/properties` without session | Redirect to `/login?next=...` |
| 3 | Sign up at `/signup` | Account + brokerage created |
| 4 | Sidebar | 6 items: Dashboard, Properties, Leads, Visits, Analytics, Settings |
| 5 | Click each sidebar link | Client navigation (no full reload); empty states on Leads/Visits/Analytics/Settings |
| 6 | Header | Organization name visible |
| 7 | User menu | Sign out works |
| 8 | Theme toggle | Dark ↔ light switch |

---

## 3. Day 22–23 — Properties list

| Step | Action | Expected |
| ---- | ------ | -------- |
| 1 | Go to `/properties` | Empty state or list from API |
| 2 | Metrics row | Total / active / draft counts (when data exists) |
| 3 | Filter | `/properties?status=active` updates list |
| 4 | Mobile width | Cards layout instead of table |
| 5 | Stop API, reload | Sonner error toast |

---

## 4. Day 24 — Create & edit property

| Step | Action | Expected |
| ---- | ------ | -------- |
| 1 | Click **Novo imóvel** | `/properties/new` form |
| 2 | Fill required fields + price in **USD** | Zod validation on submit |
| 3 | Submit | Toast success → redirect to `/properties` |
| 4 | List | New property appears |
| 5 | Click property title | `/properties/[id]` detail |
| 6 | **Editar imóvel** | `/properties/[id]/edit` |
| 7 | Change price or status, save | Changes persist after reload |

**Sample coordinates (Austin, TX):** latitude `30.2672`, longitude `-97.7431`

---

## 5. Day 25 — Map, upload, gallery

| Step | Action | Expected |
| ---- | ------ | -------- |
| 1 | Edit property, add lat/lng, save | Detail page map section updates |
| 2 | With `NEXT_PUBLIC_MAP_PROVIDER=osm` | OpenStreetMap embed with pin |
| 3 | Without coordinates | Address text fallback with MapPin icon |
| 4 | On detail page, **Selecionar imagem** | File picker (JPEG/PNG/WebP) |
| 5 | Upload progress bar | 0 → 100% during PUT |
| 6 | After upload | Toast success; image appears in gallery grid |
| 7 | Refresh page | Gallery still shows image (presigned download URL) |

**If upload fails:** confirm MinIO is running (`docker compose --profile storage up -d`) and `S3_*` vars are set in `.env`. Restart `pnpm dev` after changing env.

---

## 6. API regression (optional)

```bash
pnpm test:shared
pnpm test:api
```

Covers property CRUD, presign upload, and image confirm routes.

---

## 7. Phase 2 demo script (5 minutes)

1. **Sign up** → land on dashboard  
2. **Properties** → **Novo imóvel** → create listing with address + price  
3. **Edit** → add latitude/longitude → save  
4. **Detail** → verify map (OSM) + address  
5. **Upload photo** → confirm gallery  
6. **Back to list** → property visible with price and status  

---

## Key routes

| Route | Purpose |
| ----- | ------- |
| `/properties` | List + filters + metrics |
| `/properties/new` | Create form |
| `/properties/[id]` | Detail — summary, map, gallery, upload |
| `/properties/[id]/edit` | Edit form |

---

## Related docs

- [web/dashboard-auth.md](./web/dashboard-auth.md)
- [web/properties-module.md](./web/properties-module.md)
- [api/upload-confirm.md](./api/upload-confirm.md)
- [infra/object-storage.md](./infra/object-storage.md)
- Task packs: [PHASE-2-DAY-20.md](./tasks/PHASE-2-DAY-20.md) … [PHASE-2-DAY-25.md](./tasks/PHASE-2-DAY-25.md)
