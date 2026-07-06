import type { Metadata } from "next";

import { SubpageHero } from "@/modules/marketing/components/subpage-hero";

export const metadata: Metadata = {
  title: "Terms of Service — PropAI",
  description: "The terms that govern your use of the PropAI platform and website.",
};

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "Acceptance of terms",
    body: [
      "By accessing or using PropAI, you agree to these terms. If you are using PropAI on behalf of a brokerage, you agree on its behalf.",
    ],
  },
  {
    heading: "The service",
    body: [
      "PropAI is software that helps brokerages and agents manage listings, leads, and a public marketplace. PropAI is not a licensed real estate brokerage and does not represent buyers or sellers.",
      "We may update, improve, or change features over time. We aim to give reasonable notice of material changes.",
    ],
  },
  {
    heading: "Your responsibilities",
    body: [
      "You are responsible for the accuracy of the content you publish, including listings, pricing, and disclosures, and for complying with applicable real estate and fair-housing laws.",
      "You must keep your account credentials secure and are responsible for activity under your account.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "Don't misuse the service — no unlawful, infringing, or misleading content, and no attempts to disrupt or gain unauthorized access to the platform.",
    ],
  },
  {
    heading: "Billing",
    body: [
      "Paid plans are billed in advance on a recurring basis. You can cancel at any time; access continues through the end of the current billing period.",
    ],
  },
  {
    heading: "Disclaimer & liability",
    body: [
      "The service is provided “as is.” To the extent permitted by law, PropAI is not liable for indirect or consequential damages arising from your use of the service.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "Questions about these terms? Reach us through the contact page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Legal"
        title="Terms of Service"
        description="Last updated July 6, 2026. These are illustrative terms for a portfolio demo."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-3xl space-y-10 px-4 sm:px-6">
          {SECTIONS.map((section) => (
            <div key={section.heading}>
              <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
              <div className="text-muted-foreground mt-3 space-y-3 leading-relaxed">
                {section.body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
