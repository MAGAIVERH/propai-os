import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Closing call-to-action — a full-bleed image with a calm dark wash and a
 * centered invitation, echoing findrealestate.com's photographic closing band.
 */
export function CtaSection() {
  return (
    <section className="relative isolate flex min-h-[72svh] items-center justify-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/listings/listing-14.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/65 via-black/45 to-black/70"
      />

      <div data-animate className="mx-auto w-full max-w-3xl px-6 text-center text-white">
        <p className="text-xs font-medium tracking-[0.3em] text-white/75 uppercase">
          Ready when you are
        </p>
        <h2 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
          Run your brokerage on PropAI
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-white/85">
          See PropAI running on your own listings. Book a personal demo with our team.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full bg-white text-neutral-950 hover:bg-white/90",
            )}
          >
            Get in touch
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-full border-white/50 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white",
            )}
          >
            Agent login
          </Link>
        </div>
      </div>
    </section>
  );
}
