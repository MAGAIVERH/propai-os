import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of the PropAI OS marketplace and property listings.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="June 2026"
      intro="By using the PropAI OS marketplace, you agree to these terms. Please read them carefully."
      sections={[
        {
          heading: "Use of the marketplace",
          body: "The marketplace is provided for browsing real estate listings and contacting brokerages. You agree to use it lawfully and not to submit false, misleading, or automated inquiries.",
        },
        {
          heading: "Listing information",
          body: "Listing details are provided by participating brokerages and are believed to be accurate but are not guaranteed. Prices, availability, and features are subject to change without notice. Always verify details directly with the listing agent.",
        },
        {
          heading: "Fair Housing",
          body: "All listings are subject to the federal Fair Housing Act. We do not support or tolerate discrimination based on race, color, religion, sex, handicap, familial status, or national origin.",
        },
        {
          heading: "No agency relationship",
          body: "Browsing the marketplace or submitting an inquiry does not by itself create a brokerage or agency relationship. Such relationships are formed directly between you and a licensed brokerage.",
        },
        {
          heading: "Limitation of liability",
          body: "The marketplace is provided “as is” without warranties of any kind. To the maximum extent permitted by law, PropAI OS is not liable for any damages arising from your use of the service.",
        },
      ]}
    />
  );
}
