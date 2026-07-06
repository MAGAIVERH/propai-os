import type { Metadata } from "next";

import { BuyerLoginForm } from "@/modules/account/components/buyer-auth";
import { AuthShell } from "@/modules/auth/components/auth-shell";

export const metadata: Metadata = {
  title: "Sign in — PropAI",
  description: "Sign in to save homes and book tours with a single tap.",
};

export default function BuyerLoginPage() {
  return (
    <AuthShell
      image="/listings/listing-17.jpg"
      imageAlt="A sunlit modern living room"
      eyebrow="Your home search"
      headline="Pick up right where you left off."
      quote="I saved a shortlist on my phone and booked three tours before lunch."
      quoteAuthor="Amelia, buyer in Sausalito"
    >
      <BuyerLoginForm />
    </AuthShell>
  );
}
