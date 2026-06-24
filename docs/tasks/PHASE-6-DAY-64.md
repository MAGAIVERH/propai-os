# Phase 6 · Day 64 — Tenant settings and branding

> White-label lite for brokerages.

## Tasks
- [x] **T1** — DB: branding columns on `tenant_settings` (primary_color, marketplace_slug; logo_url already existed) + unique partial index on slug — migration `0011`.
- [x] **T2** — API `modules/settings`: `GET /v1/settings` (org name/slug + settings), `PATCH /v1/settings` (agency name, timezone, logo URL, brand color, marketplace slug; owner only; 409 on slug conflict).
- [x] **T3** — Web `/settings/general` (`general-settings-form.tsx`): agency name, timezone, color picker, logo URL, marketplace slug (`<slug>.propai.io`).
- [x] **T4** — Public branding: `GET /public/branding?tenantId=` returns agency name, logo, color. Marketplace layout applies the brand color (CSS var override) and shows the agency name + logo in the header/footer.

## Done
A brokerage's custom name, logo, and brand color appear on their marketplace. Verified in `settings.integration.test.ts` (settings read/update) + live marketplace branding.
