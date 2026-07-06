"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useBuyerSession } from "../use-buyer-session";

/**
 * "Request a tour" on a listing. A signed-in buyer books in one tap — their
 * details are already known, so the request goes straight to the agent (this
 * would create a lead in the brokerage CRM in the real product). Signed-out
 * visitors are invited to sign in, with a no-account contact fallback.
 */
export function RequestTourButton({ listingTitle }: { listingTitle: string }) {
  const { buyer } = useBuyerSession();
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="border-primary/20 bg-primary/5 text-primary flex items-start gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium">
        <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>Tour requested — an agent will be in touch shortly.</span>
      </div>
    );
  }

  if (buyer) {
    return (
      <button
        type="button"
        onClick={() => {
          setSent(true);
          toast.success(`Tour request for ${listingTitle} sent to the agent.`);
        }}
        className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full")}
      >
        Request a tour
      </button>
    );
  }

  return (
    <div>
      <Link
        href="/account/login"
        className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full")}
      >
        Sign in to book a tour
      </Link>
      <p className="text-muted-foreground mt-2 text-center text-xs">
        or{" "}
        <Link href="/contact" className="hover:text-foreground underline underline-offset-2">
          send a message
        </Link>{" "}
        without an account
      </p>
    </div>
  );
}
