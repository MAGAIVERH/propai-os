import type { Metadata } from "next";

import { CtaSection } from "@/modules/marketing/components/cta-section";
import { FaqSection } from "@/modules/marketing/components/faq-section";
import { FeaturesSection } from "@/modules/marketing/components/features-section";
import { HeroSection } from "@/modules/marketing/components/hero-section";
import { HowItWorksSection } from "@/modules/marketing/components/how-it-works-section";
import { LandingAnimations } from "@/modules/marketing/components/landing-animations";
import { PricingSection } from "@/modules/marketing/components/pricing-section";
import { TestimonialsSection } from "@/modules/marketing/components/testimonials-section";
import { HouseHero } from "@/modules/marketing/experience/house-hero";

export const metadata: Metadata = {
  title: "PropAI OS — The operating system for modern real estate agencies",
  description:
    "PropAI OS is an AI-powered Real Estate Operating System for US brokerages — multi-tenant CRM, pipeline, marketplace, semantic search, and analytics.",
  openGraph: {
    title: "PropAI OS — The operating system for modern real estate agencies",
    description:
      "CRM, pipeline, AI listings, and a public marketplace — all in one platform built for US brokerages.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      {/* Immersive 3D gallery hero (client-only, WebGL) */}
      <HouseHero />

      <LandingAnimations>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </LandingAnimations>
    </>
  );
}
