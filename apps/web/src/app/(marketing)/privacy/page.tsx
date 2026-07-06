import type { Metadata } from "next";

import { SubpageHero } from "@/modules/marketing/components/subpage-hero";

export const metadata: Metadata = {
  title: "Privacy Policy — PropAI",
  description: "How PropAI collects, uses, and protects your information.",
};

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "Overview",
    body: [
      "PropAI provides software for real estate brokerages and agents. This policy explains what information we collect, how we use it, and the choices you have. It applies to our marketing site and the PropAI platform.",
      "PropAI is a software provider, not a licensed real estate brokerage.",
    ],
  },
  {
    heading: "Information we collect",
    body: [
      "Account information you provide, such as your name, email address, brokerage name, and billing details.",
      "Content you create in the platform, including property listings, leads, and messages.",
      "Usage data, such as pages viewed and features used, collected to improve the product.",
    ],
  },
  {
    heading: "How we use information",
    body: [
      "To operate and improve the platform, provide support, and communicate with you about your account.",
      "To keep the service secure, prevent abuse, and comply with legal obligations.",
      "We do not sell your personal information.",
    ],
  },
  {
    heading: "How we protect data",
    body: [
      "Each brokerage's data is isolated at the database layer using row-level security, so one tenant can never access another's data.",
      "We use encryption in transit and follow industry-standard practices to safeguard information.",
    ],
  },
  {
    heading: "Your choices",
    body: [
      "You can access, update, or export your data from within the platform, subject to your team's roles and permissions.",
      "You can request deletion of your account by contacting us. Some records may be retained where required by law.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "Questions about this policy? Reach us through the contact page and we'll be glad to help.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="Last updated July 6, 2026. This is an illustrative policy for a portfolio demo."
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
