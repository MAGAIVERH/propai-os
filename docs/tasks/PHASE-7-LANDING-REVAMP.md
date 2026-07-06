# Phase 7+ — Landing revamp & buyer accounts (post-Day-75)

**Delivery note** for the marketing-site work that landed after the Phase 7
sign-off (Day 75). Shipped in **PR #34** (self-contained landing + buyer accounts)
and **PR #35** (UI refinements), both merged to `main`. Product language: en-US.

> Context: after Day 75 the landing still linked out to the separate marketplace
> app (port 3001), so many links dead-ended when only `pnpm dev` was running.
> This work made the marketing site **self-contained** and added a **buyer
> identity** distinct from the brokerage/agent login.

---

## 1 — Self-contained marketing site

**Objective:** Every link on the landing resolves to a real page in `apps/web`,
so the site works on `pnpm dev` alone.

**Shipped:**
- New pages under `app/(marketing)/`: `/listings` (+ `/listings/[slug]` detail with
  gallery, specs, features), `/insights` (+ `/insights/[slug]` article), `/about`,
  `/contact` (mock lead form), `/privacy`, `/terms`.
- Shared `SubpageHero` for inner pages; the nav is solid on every route except the
  landing hero (`usePathname() === "/"`).
- Removed the cross-app `marketplaceUrl()` helper; all listing/insight/service/
  market/footer links now point to internal routes. Dynamic pages use Next 16
  async `params` + `generateStaticParams` + `notFound()`.

**Done:** No dead links; every internal target returns 200 and a slug that doesn't
exist returns 404.

---

## 2 — Two separate identities (buyer vs. agent)

**Objective:** End users (buyers/renters) get their own account, separate from the
brokerage/agent login, and stay logged in.

**Shipped:**
- **Brokerage/agent** — unchanged Better Auth. Site entry relabeled **"Agent
  login"** → `/login`; the brokerage pitch CTA is **"Get in touch"** → `/contact`.
  Open self-serve signup is not advertised — only a discreet "Create an account"
  link on `/login`.
- **Buyer** — new **client-side demo session** (`modules/account/use-buyer-session.ts`,
  `useSyncExternalStore` + localStorage). Pages at `/account/login` and
  `/account/register` (plain `app/account/…`, no marketing chrome). The nav shows
  the buyer's name + sign-out; a signed-in buyer requests a tour in **one click**
  (`RequestTourButton`) — simulating an auto-lead into the CRM — while signed-out
  visitors are routed to `/account/login` or the `/contact` fallback.

**Done:** Buyer can register, stay logged in across reloads, and one-click a tour;
the brokerage flow (login → dashboard) is untouched.

---

## 3 — Premium auth (all four screens)

**Objective:** Replace the "junior"-looking centered card with a premium layout.

**Shipped:**
- Shared split-screen `AuthShell` (`modules/auth/components/auth-shell.tsx`):
  cinematic photo panel + proof on the left, form on the right, collapses on
  mobile. Used by both buyer pages and the brokerage `(public)/layout.tsx`.
- Buyer forms (`modules/account/components/buyer-auth.tsx`) with icon inputs and a
  show/hide password toggle.

**Done:** Login/register (buyer) and login/signup/setup (brokerage) all share the
premium frame.

---

## 4 — Landing polish

**Objective:** Make the landing read as premium and interactive.

**Shipped:**
- **Nav** — persistent, mobile-first: transparent over the hero, condenses into a
  solid blurred bar past the fold, full-screen hamburger overlay on mobile,
  back-to-top control. "Agent login" / "Sign in" draw a **pill outline** on hover;
  "Book a consultation" is a dark gradient pill with a sliding arrow and light
  sweep.
- **Testimonials** — rebuilt as an editorial featured quote + an opposing-direction
  marquee (removed the ragged masonry).
- **Services** — horizontal rail with a hover spotlight and arrow controls; first
  card aligns to the section gutter with a peek, and no trailing gap.
- **Copy/links** — buyer CTAs → `/contact`; "Request a demo" → "Get in touch";
  footer signature "Designed & built by Magaiver Magalhães".

**Done:** `pnpm lint` + `tsc` clean; all routes verified 200; CI green on PR #34 and
PR #35 (Lint & typecheck · API tests · Web build).

---

## Summary

| Area | Delivered | Merged |
|------|-----------|--------|
| Self-contained pages (listings, insights, about, contact, legal) | ✅ | PR #34 |
| Link fixes (no cross-app dead links) | ✅ | PR #34 |
| Buyer accounts + one-click tour | ✅ | PR #34 |
| Premium split-screen auth (buyer + brokerage) | ✅ | PR #34 |
| Nav (mobile menu, condensed state, hover effects), testimonials, services rail | ✅ | PR #34 / #35 |
| Copy: "Get in touch", author signature | ✅ | PR #35 |

**Outcome:** A premium, fully self-contained brokerage marketing site with two
distinct identities — buyers browse and book with a lightweight account, agents log
in to the dashboard — running on `pnpm dev` with no dead links.

*Delivery note for Magaiver — Phase 7+ (post-Day-75).*
