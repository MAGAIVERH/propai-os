import { Quote } from "lucide-react";

import { TESTIMONIALS } from "../content";

export function TestimonialsSection() {
  return (
    <section className="bg-muted/20 border-y border-border/60 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 data-animate className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for the way brokerages actually work
          </h2>
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <li
              key={testimonial.name}
              data-animate
              className="border-border/60 bg-card/50 flex flex-col rounded-xl border p-6"
            >
              <Quote className="text-primary/40 size-6" aria-hidden="true" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed">
                “{testimonial.quote}”
              </blockquote>
              <footer className="mt-6">
                <p className="text-sm font-medium">{testimonial.name}</p>
                <p className="text-muted-foreground text-xs">{testimonial.role}</p>
              </footer>
            </li>
          ))}
        </ul>

        <p className="text-muted-foreground/70 mt-8 text-center text-xs">
          Testimonials are illustrative examples for this portfolio demo.
        </p>
      </div>
    </section>
  );
}
