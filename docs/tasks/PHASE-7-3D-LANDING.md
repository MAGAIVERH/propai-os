# Phase 7 · 3D Gallery Landing (immersive hero)

**Goal:** An extraordinary, "drone-through-the-house" landing where every brokerage
gets a wall/room of listings you can walk into — built with real WebGL 3D
(React Three Fiber), not video.

## Stack
- `three` + `@react-three/fiber` (v9, React 19) + `@react-three/drei` (v10).
- Mounted client-only via `next/dynamic({ ssr: false })` so WebGL never runs in SSR.

## Files (`apps/web/src/modules/marketing/experience/`)
- `showroom-data.ts` — brokerage/listing model + curated demo data. Listing
  `imageUrl: null` renders a tasteful placeholder panel (no fake photos); `closed`
  renders a SOLD/leased state.
- `scene.tsx` — the 3D world: reflective floor, ceiling washes, corridor with
  per-brokerage **alcoves** (back wall + side walls + emissive accent strip),
  museum-style accent + white spotlights, far-wall PropAI wordmark, structural
  pillars. Listing **murals** are crisp HTML-in-3D (`drei <Html transform>`),
  clickable. `CameraRig` eases the camera (drone feel) toward the active target.
- `house-experience.tsx` — `<Canvas>` + overlay UI (brokerage switcher, Back to
  gallery, listing detail card), reduced-motion aware, **no-WebGL 2D fallback**.
- `house-hero.tsx` — client `dynamic(ssr:false)` wrapper with a loading state.

## Interaction
- Intro: camera eases in from above/behind (drone fly-in); reduced-motion skips it.
- Click a brokerage wall (or its chip) → camera flies **into** that alcove showing
  its listings as murals. **Back to gallery** returns to the overview.
- Click a listing mural → detail card (price/meta) with a "Start free" CTA; closed
  listings show "no longer available".

## Mocked-image policy (per product requirement)
- Murals never show fake photography. Until a brokerage publishes real listing
  photos, murals render an elegant placeholder panel; sold/leased listings show a
  SOLD state. The model already supports real `imageUrl`s — wiring the public
  marketplace API to populate `brokerages`/`listings` is the next step (the
  `HouseExperience` component already accepts a `brokerages` prop for this).

## Verified
- Typecheck + lint green. Page serves 200; SSR shows the loading fallback.
- Headless-Chrome (SwiftShader) screenshots confirm the gallery renders and that
  entering a brokerage bay (e.g. Summit Realty Group) flies the camera in and
  shows its four listing murals (incl. the SOLD one).

## Follow-ups (next round)
- Populate from real published listings via `/public/*` API (replace demo data).
- Optional: deeper "enter the room" geometry (doorway portals) and a scroll-driven
  intro; texture murals with real photos (CORS-enabled) when available.
- Tune aesthetics with stakeholder feedback (lighting, color, camera pacing).
