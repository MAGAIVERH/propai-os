import { Star } from "lucide-react";

import { TESTIMONIALS } from "../content";

/**
 * Symmetric testimonial grid — three evenly-weighted cards with ratings.
 */
export function TestimonialsSection() {
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p data-animate className="text-primary text-sm font-semibold tracking-wide">
            Client stories
          </p>
          <h2
            data-animate
            className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Trusted by brokerages and the buyers they serve
          </h2>
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <li
              key={testimonial.name}
              data-animate
              className="border-border bg-card flex flex-col rounded-2xl border p-8"
            >
              <div className="text-primary flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="size-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-5 flex-1 leading-relaxed text-pretty">
                “{testimonial.quote}”
              </blockquote>
              <footer className="border-border mt-6 border-t pt-5">
                <p className="font-medium">{testimonial.name}</p>
                <p className="text-muted-foreground text-sm">{testimonial.role}</p>
              </footer>
            </li>
          ))}
        </ul>

        <p className="text-muted-foreground/70 mt-10 text-center text-xs">
          Testimonials are illustrative examples for this portfolio demo.
        </p>
      </div>
    </section>
  );
}
