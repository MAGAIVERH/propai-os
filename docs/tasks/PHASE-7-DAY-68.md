# Phase 7 · Day 68 — Pricing + signup CTA + FAQ

**Objective:** Convert landing visitors into trial signups.

## What was built

- **Pricing section** (`pricing-section.tsx`): Free vs Pro comparison cards.
  - Free: $0 forever — 5 active listings, 2 agents, real-time CRM, marketplace,
    AI listing generation.
  - Pro: $49/mo — unlimited listings & agents, semantic search, analytics + CSV,
    custom branding, priority support. Marked "Most popular".
  - Both CTAs route to `/signup`. Plan limits mirror the Phase 6 billing gates
    (Free = 5 listings / 2 agents).
- **FAQ section** (`faq-section.tsx`): 6 common questions using native
  `<details>/<summary>` (accessible, keyboard-friendly, zero-JS).
- **CTA section** (`cta-section.tsx`): final conversion banner → `/signup`.
- Nav + Hero CTAs also route to `/signup` and `/login`.

## How to test

1. `pnpm dev`, open `/#pricing` → two plans render; click any CTA → `/signup`.
2. Open `/#faq` → expand/collapse questions with mouse and keyboard.

## Notes

- Pricing copy intentionally matches the real feature gates so the marketing
  promise and the product behavior stay consistent.
