import { Plus } from "lucide-react";

import { FAQ } from "../content";

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <h2 data-animate className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p data-animate className="text-muted-foreground mt-4 text-lg">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="mt-12 divide-y divide-border/60">
          {FAQ.map((item) => (
            <details key={item.question} data-animate className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <Plus
                  className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
