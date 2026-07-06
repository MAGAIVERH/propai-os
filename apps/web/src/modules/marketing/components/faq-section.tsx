import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { FAQ } from "../content";

/**
 * FAQ in a warm two-column layout: a welcoming image + "talk to us" panel on the
 * left, the questions on the right. (Image is a placeholder — ideally a photo of
 * an agent talking with a client.)
 */
export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-24 sm:py-28">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/agents/agent-faq.jpg"
              alt="A PropAI real estate advisor ready to help"
              loading="lazy"
              className="h-full w-full object-cover object-[68%_center]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="text-lg font-semibold">Still have questions?</p>
              <p className="mt-1 text-sm text-white/80">
                Talk to a real person. No bots, no pressure.
              </p>
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "mt-4 rounded-full bg-white text-neutral-950 hover:bg-white/90",
                )}
              >
                Talk to our team
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div>
          <p data-animate className="text-primary text-sm font-semibold tracking-wide">
            FAQ
          </p>
          <h2
            data-animate
            className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Frequently asked questions
          </h2>

          <div className="divide-border/70 mt-8 divide-y">
            {FAQ.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <Plus
                    className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  />
                </summary>
                <p className="text-muted-foreground mt-3 leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
