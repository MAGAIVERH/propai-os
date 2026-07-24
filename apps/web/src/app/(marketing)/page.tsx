import type { Metadata } from "next";

import { BlogSection } from "@/modules/marketing/components/blog-section";
import { CinematicReveal } from "@/modules/marketing/components/cinematic-reveal";
import { CtaSection } from "@/modules/marketing/components/cta-section";
import { FaqSection } from "@/modules/marketing/components/faq-section";
import { FeaturedListings } from "@/modules/marketing/components/featured-listings";
import { LandingAnimations } from "@/modules/marketing/components/landing-animations";
import { MarketsBand } from "@/modules/marketing/components/markets-band";
import { PhotoHero } from "@/modules/marketing/components/photo-hero";
import { ServicesBand } from "@/modules/marketing/components/services-band";
import { ShowcaseSection } from "@/modules/marketing/components/showcase-section";
import { StatsBand } from "@/modules/marketing/components/stats-band";
import { StoriesSection } from "@/modules/marketing/components/stories-section";

// Canonical public origin for social/OG absolute URLs. Hardcoded so link
// previews (LinkedIn, WhatsApp, X) resolve the image regardless of the deploy
// platform's env vars.
const SITE_URL = "https://propai-os-api.vercel.app";
const OG_IMAGE = `${SITE_URL}/hero/houses-poster.jpg`;
const OG_DESCRIPTION =
  "A curated collection of exceptional homes and the intelligent platform that powers the brokerages behind them.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "PropAI — Luxury Real Estate, Intelligently Run",
  description:
    "PropAI is the operating system for modern real estate brokerages — a curated marketplace, AI listings, semantic search, and a real-time CRM in one premium platform.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "PropAI OS",
    title: "PropAI — Luxury Real Estate, Intelligently Run",
    description: OG_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1280,
        height: 720,
        alt: "PropAI — Find what moves you",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PropAI — Luxury Real Estate, Intelligently Run",
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function LandingPage() {
  return (
    <>
      <PhotoHero />

      <LandingAnimations>
        <CinematicReveal />
        <FeaturedListings />
        <StatsBand />
        <ServicesBand />
        <ShowcaseSection />
        <MarketsBand />
        <StoriesSection />
        <BlogSection />
        <FaqSection />
        <CtaSection />
      </LandingAnimations>
    </>
  );
}
