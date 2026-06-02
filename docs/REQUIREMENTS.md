# PropAI OS — Product Requirements (v1)

**Document:** `docs/REQUIREMENTS.md`  
**Language:** English (en-US)  
**Market:** United States real estate brokerages  
**Status:** MVP scope locked · v2 items explicitly deferred

---

## Overview

PropAI OS is an AI-powered Real Estate Operating System for US brokerages. Version 1 delivers a multi-tenant brokerage dashboard (CRM, pipeline, properties, analytics), a public SEO marketplace with semantic search and lead capture, and async AI workflows (vision, embeddings, lead scoring, price estimates). This document defines actors, core flows, AI scope, US property fields, and what is **in** vs **out** of v1.

---

## Actors

### Brokerage Owner

- Owns the brokerage workspace, subscription, and billing; configures organization settings and compliance policies.
- Invites and assigns roles (Manager, Agent, Viewer); retains full access to CRM, pipeline, listings, and analytics.
- Approves high-impact actions such as workspace deletion, data exports, and integration credentials.

### Manager

- Oversees day-to-day operations: lead distribution, pipeline stages, listing quality, and team performance.
- Manages agents and viewers within the workspace; configures workflows, visit scheduling rules, and CRM fields as permitted.
- Monitors funnel metrics, team activity, and deal progress; escalates or reassigns stalled opportunities.

### Agent

- Works assigned leads and deals in the CRM; updates contact records, notes, tasks, and pipeline status.
- Creates and maintains property listings (photos, US market fields, pricing); coordinates showings and follow-ups.
- Converts marketplace inquiries into qualified leads; moves opportunities through stages toward close.

### Viewer (read-only)

- Views CRM records, listings, pipeline boards, and reports without create, edit, or delete permissions.
- Supports compliance, finance, or executive oversight with read-only visibility into team activity and deal status.
- Exports or shares data only when explicitly granted by organization policy; cannot invite users or change settings.

### Public visitor (marketplace)

- Browses published listings on the public marketplace via search and filters (including semantic/natural-language query where enabled).
- Submits interest forms or contact requests that create or enrich leads in the brokerage CRM.
- Does not authenticate into the brokerage workspace; identity is limited to information voluntarily provided at capture.

---

## Brokerage flow

1. **Sign up** — A Brokerage Owner registers an account, verifies email, and accepts terms; identity is established for organization creation and billing.

2. **Create workspace** — The owner provisions a multi-tenant organization (brokerage workspace), sets profile and market defaults (e.g., state, currency, timezone), and selects a plan.

3. **Invite agents** — The owner or Manager sends invitations; recipients join with assigned roles (Agent, Manager, or Viewer) scoped to that workspace.

4. **Add properties** — Agents or Managers create listings with US-standard fields, media, and location data; approved listings may publish to the internal CRM and public marketplace.

5. **Manage leads** — Inbound leads (marketplace, manual entry, imports) are captured in the CRM, scored or prioritized, assigned to agents, and tracked through pipeline stages.

6. **Schedule visits** — Agents coordinate property showings with prospects; appointments are recorded against listings and lead records for follow-up and audit.

7. **Close deals** — Opportunities advance to won/lost outcomes; deal value, stage history, and closing details are recorded for reporting and commission workflows.

8. **View analytics** — Owners and Managers review funnel, listing, agent, and revenue metrics; read-only Viewers may access dashboards per role policy to inform decisions.

---

## Public flow (marketplace)

The public marketplace is an unauthenticated, SEO-friendly surface (`apps/marketplace`) for property discovery and lead capture. Interest submitted on the marketplace must appear in the brokerage CRM without manual import or batch sync.

### Flow (step-by-step)

1. **Browse marketplace** — Visitor lands on the public catalog (SSR/SEO). They can filter and paginate listings scoped to published inventory; no account is required.

2. **Semantic search** — Visitor enters a natural-language query (e.g., “3 bed under 500k near good schools in Austin”). The system resolves intent via vector/semantic search (pgvector) and returns ranked property results—not keyword-only matching.

3. **View property** — Visitor opens a property detail page: photos, US-standard fields (beds, baths, sq ft, price, location), and brokerage/listing metadata needed to evaluate the listing.

4. **Submit interest** — Visitor completes the interest/lead form (contact info, optional message, property reference, consent as required). Submission is validated server-side and attributed to the correct listing and tenant.

5. **Lead appears in CRM in real time** — On successful submission, a lead record is created in the tenant-scoped CRM and surfaced on the dashboard pipeline/board for agents and managers assigned to that workspace.

### Real-time expectation (WebSocket)

Lead creation and related CRM updates (new lead card, pipeline placement, in-app notification) must propagate to connected dashboard clients in **real time** via the API WebSocket layer—not on a polling-only or “refresh to see” model for v1. Target behavior: an agent with the CRM open sees the new lead within seconds of marketplace submission.

---

## AI features (v1)

### Vision (photo → listing fields)

- **Given** an authenticated agent has uploaded 1–10 property photos to a draft listing, **when** they run “Analyze photos with AI,” **then** the system enqueues an async job (BullMQ) and does not block the HTTP request on the LLM call.
- **Given** `ENABLE_AI_VISION=true` and valid image URLs (presigned download), **when** analysis completes, **then** the API returns structured JSON validated with Zod (e.g., bedrooms, bathrooms, sq ft, feature tags, marketing description, SEO title, optional suggested list price in USD).
- **Given** analysis succeeds, **when** results are shown in the property form, **then** fields are pre-filled as suggestions only; the agent must review and save before publish.
- **Given** vision is disabled or the provider fails, **when** the user requests analysis, **then** the UI shows a clear error or graceful fallback to manual entry without data loss.
- **Given** a tenant context, **when** vision is invoked, **then** rate limiting applies (e.g., 10 requests/hour per tenant) and usage is attributable to that organization.

### Semantic search (pgvector)

- **Given** a published property with title, description, and features, **when** it is saved or published, **then** an embedding job runs asynchronously and stores a `vector(1536)` on the property record (pgvector enabled on Neon).
- **Given** semantic search is enabled and indexed properties exist, **when** a user submits a natural-language query, **then** the API returns up to 20 results ordered by vector similarity with tenant-appropriate scope.
- **Given** semantic search is used, **when** results are returned, **then** standard filters (price range, bedrooms, city/state) may be combined with vector score (hybrid search).
- **Given** a property is unpublished or soft-deleted, **when** search runs, **then** it is excluded from public/marketplace results.

### Lead scoring

- **Given** a lead record linked (optionally) to a property and activity history, **when** scoring is triggered, **then** the system computes a score 0–100, a short reasoning string, and a priority label (`hot` / `warm` / `cold`).
- **Given** scoring completes, **when** the lead is fetched in CRM or Kanban, **then** `aiScore` and priority are visible on the lead card and API response.
- **Given** AI scoring is unavailable, **when** a lead is created, **then** the lead is still usable with manual priority; scoring failure does not block CRM workflows.

### Price estimate

- **Given** a property with US location, type, beds, baths, and sq ft, **when** the agent requests a price suggestion, **then** the system uses same-tenant comparables and an LLM prompt to return a suggested price **range** in USD.
- **Given** a price estimate is displayed, **then** the UI shows a persistent disclaimer: **“Estimate only — not an appraisal. Not for lending, underwriting, or legal valuation. Confirm with a licensed professional.”**
- **Given** insufficient comparables, **when** estimate is requested, **then** the system returns a clear “insufficient data” state rather than a fabricated number.

---

## US property fields (v1)

| Field | Type / format | Notes |
| --- | --- | --- |
| **List price** | Integer (cents) in DB | Display as `$1,250,000` (en-US). Required for active listings. |
| **Listing intent** | Enum: `sale` \| `rent` | Drives marketplace filters and CRM workflows. |
| **Bedrooms** | Integer ≥ 0 | Whole bedrooms; studio may be `0`. |
| **Bathrooms** | Decimal (e.g., `2.5`) | Supports half-baths; one decimal place max in v1. |
| **Living area (sq ft)** | Integer | US customary only in v1; no m². |
| **HOA fee** | Integer (USD/month) or nullable | Monthly HOA in USD; `null` if N/A. |
| **Year built** | Integer (YYYY) | Valid range e.g. 1800–current year + 1. |
| **Property type** | Enum | `Single Family`, `Condo`, `Townhouse`, `Multi-Family`. Required. |
| **Address — line 1** | String | Street number and name; required. |
| **Address — city** | String | Required. |
| **Address — state** | Enum (US) | 50 states + DC; 2-letter code in API (e.g., `TX`). |
| **Address — ZIP** | String | 5-digit or ZIP+4 (`12345` or `12345-6789`). |
| **Latitude / longitude** | Decimal, optional | WGS84; recommended for map display; may be set via map picker. |

**Validation:** All monetary values in USD; addresses US-only; status workflow: draft → active → under contract → sold/rented; soft delete preserves audit history.

---

## Out of scope (v1)

| Item | Reason (v1) |
|------|-------------|
| **MLS integration** | Requires MLS vendor agreements, feed normalization, and ongoing compliance; not required to prove core CRM + marketplace + lead loop. |
| **Mortgage calculator** | Adds regulated financial UX and liability surface; out of scope for a brokerage operations platform MVP. |
| **3D virtual tour (Three.js)** | High build and performance cost; does not unblock lead capture, CRM, or semantic search. |
| **Native mobile app** | v1 is responsive web (dashboard + marketplace); native iOS/Android doubles platform and release overhead. |
| **Multi-language i18n** | v1 targets US brokerages with English (en-US) UI and copy; localization is deferred until core workflows are stable. |

---

## v2 backlog (reference only)

**Not in v1.** Items below are placeholders for future planning; order and scope are not committed.

- **Google Calendar sync** — Two-way scheduling for showings and follow-ups from CRM activities.
- **Outbound webhooks & integration hooks** — Tenant-configurable events (e.g., new lead, stage change) for Zapier/custom stacks.
- **MLS / IDX data feeds** — Automated listing ingest and sync from approved MLS sources.
- **Public API keys & partner integrations** — Documented REST surface for brokerage-owned automations.
- **Advanced analytics & exports** — Deeper funnel/cohort reporting and scheduled exports beyond v1 dashboard metrics.

---

## MVP summary

Version 1 must deliver a credible end-to-end story for US brokerages: an agent signs into a multi-tenant workspace, creates a property with standard US fields and photos, uses AI to draft listing details from images, publishes the listing, and sees it discoverable via natural-language semantic search on the public marketplace. A visitor can browse, search semantically, submit interest, and have that lead appear in the brokerage CRM with AI-assisted priority scoring on a Kanban pipeline. Price guidance is available as a non-binding estimate with clear disclaimers. Together—secure tenant isolation (RLS), properties CRUD, async AI workers, marketplace lead capture, and CRM pipeline—this constitutes a demo-ready PropAI OS v1.

---

## Two-minute product pitch (reference)

> PropAI OS is an AI-powered Real Estate Operating System for US brokerages. It unifies multi-tenant CRM, deal pipeline, and a public property marketplace in one platform—with semantic search, AI-assisted listings from photos, lead scoring, and analytics. Brokerages run their business from one workspace; buyers discover listings on the marketplace and become leads in the CRM in real time.
