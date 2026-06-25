import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div
          data-animate
          className="border-border/60 bg-card/60 relative overflow-hidden rounded-3xl border px-6 py-16 text-center sm:px-12"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-2xl rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_20%,transparent),transparent)] blur-2xl"
          />
          <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Ready to run your brokerage on PropAI OS?
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
            Create your workspace in minutes. No credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/signup" />}>
              Start free
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
