import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How the PropAI OS marketplace collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="June 2026"
      intro="Your privacy matters. This policy explains what information we collect when you browse listings or contact an agent through the PropAI OS marketplace, and how we use it."
      sections={[
        {
          heading: "Information we collect",
          body: "When you submit an inquiry, we collect the name, email, phone number, and message you provide, along with the listing you were viewing. We also collect basic technical data such as your IP address and browser type to keep the service secure and reliable.",
        },
        {
          heading: "How we use your information",
          body: "We share your inquiry with the brokerage that manages the listing so a licensed agent can follow up. We use technical data to prevent spam and abuse, to rate-limit submissions, and to improve the marketplace experience.",
        },
        {
          heading: "Cookies and analytics",
          body: "We use essential cookies to keep the site working and, with your consent, optional analytics cookies to understand aggregate usage. You can decline optional cookies using the banner shown on your first visit.",
        },
        {
          heading: "Data retention",
          body: "Inquiry data is retained by the receiving brokerage according to their own retention practices. You may request deletion of your personal information by contacting us.",
        },
        {
          heading: "Your rights",
          body: "Depending on your state of residence, you may have the right to access, correct, or delete your personal information. Contact privacy@propai.example to exercise these rights.",
        },
      ]}
    />
  );
}
