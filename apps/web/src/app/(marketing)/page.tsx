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

export const metadata: Metadata = {
  title: "PropAI — Luxury Real Estate, Intelligently Run",
  description:
    "PropAI is the operating system for modern real estate brokerages — a curated marketplace, AI listings, semantic search, and a real-time CRM in one premium platform.",
  openGraph: {
    title: "PropAI — Luxury Real Estate, Intelligently Run",
    description:
      "A curated collection of exceptional homes and the intelligent platform that powers the brokerages behind them.",
    type: "website",
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
