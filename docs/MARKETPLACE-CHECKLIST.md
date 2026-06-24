# Public Marketplace Checklist (Phase 5 · Days 46–55)

Sign-off for the public marketplace (`apps/marketplace`, port 3001). Status: **100%**.

## Scaffold & navigation (Day 46)
- [x] Separate Next.js app, no auth required to browse
- [x] Shared header (Browse / Map / AI Search / About / Contact) + footer on every page
- [x] US-English metadata defaults (title template, OG `en_US`, Twitter card)
- [x] Routes: `/`, `/properties`, `/properties/[id]`, `/properties/map`, `/search`, `/about`, `/contact`, `/privacy`, `/terms`

## Listing & filters (Day 47)
- [x] SSR grid with URL-bound filters (city, state, type, buy/rent, beds, price)
- [x] Shareable / Google-able URLs with descriptive `<title>`
- [x] Property cards (price, beds/baths/sqft, location, listing badge)
- [x] "Load more" cursor pagination

## Detail page (Day 48)
- [x] Gallery (photos or graceful placeholder)
- [x] Key facts, description, features list
- [x] Location map (single pin) with no-coordinates fallback
- [x] JSON-LD `RealEstateListing`
- [x] Open Graph + Twitter tags (primary photo as social image)
- [x] "Request a showing" CTA → lead form

## Lead capture (Day 49)
- [x] `POST /public/leads` (+ `/public/interest` alias) creates a CRM lead
- [x] IP rate limit (Redis, 5 / 10 min), fails open
- [x] Honeypot anti-spam (silent drop)
- [x] Live `lead:created` → dashboard Kanban + notification

## Semantic search (Day 50)
- [x] Natural-language search bar + example prompts
- [x] Results with relevance score chips
- [x] Empty state + graceful `503` (flag off) fallback to browse

## Map (Day 51)
- [x] `/properties/map` clustered pins (Leaflet + markercluster)
- [x] List ↔ map selection sync + preview card
- [x] US-centered default, recenters to filters

## Ranking (Day 52)
- [x] Hybrid: semantic 40% + price 20% + distance 20% + recency 20%
- [x] Sort: Best match / Price low→high / Newest
- [x] ADR 008 + unit tests

## Performance (Day 53)
- [x] `GET /public/properties` cached (TTL 5 min)
- [x] `X-Cache: HIT|MISS` header
- [x] Invalidation on property create/update/delete

## Compliance (Day 54)
- [x] Fair Housing disclaimer in the footer (all pages)
- [x] `/privacy` + `/terms` linked from footer
- [x] Cookie notice (consent persisted)

## Polish & signoff (Day 55)
- [x] Mobile responsive across all pages
- [x] Loading skeletons
- [x] Global 404 + "listing unavailable" 404
- [x] Typecheck / lint / build green; API + new integration tests pass

## Demo script
Browse `localhost:3001` → open a listing → "Request a showing" → submit →
new lead card appears on the dashboard Kanban (`localhost:3000`) within seconds,
with a bell notification.
