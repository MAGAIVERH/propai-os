import type { Metadata } from "next";

import { BuyerRegisterForm } from "@/modules/account/components/buyer-auth";
import { AuthShell } from "@/modules/auth/components/auth-shell";

export const metadata: Metadata = {
  title: "Create your account — PropAI",
  description: "Save your favorite homes, get alerts, and request tours with a single tap.",
};

export default function BuyerRegisterPage() {
  return (
    <AuthShell
      image="/listings/listing-04.jpg"
      imageAlt="A modern luxury home at dusk"
      eyebrow="Find what moves you"
      headline="Your next home, saved and ready."
      quote="One account, every home I love in one place — and tours a tap away."
      quoteAuthor="David, buyer in Austin"
    >
      <BuyerRegisterForm />
    </AuthShell>
  );
}
