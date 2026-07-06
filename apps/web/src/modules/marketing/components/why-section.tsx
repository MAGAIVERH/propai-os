import { WHY } from "../content";
import { ScrollFillText } from "./scroll-fill-text";

/**
 * "Why PropAI" — a small left label paired with a large scroll-filled statement,
 * followed by a full-bleed editorial image. Mirrors findrealestate.com's
 * "Your life's changing…" reveal block over a drone clip.
 */
export function WhySection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[180px_1fr]">
          <p
            data-animate
            className="text-muted-foreground pt-2 text-sm font-medium tracking-wide"
          >
            {WHY.label}
          </p>
          <ScrollFillText
            as="h2"
            text={WHY.statement}
            className="text-2xl leading-snug font-semibold tracking-tight text-balance sm:text-4xl"
          />
        </div>
      </div>

      <div className="mt-14 px-4 sm:px-6">
        <figure
          data-animate
          className="mx-auto max-w-[1600px] overflow-hidden rounded-3xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={WHY.media}
            alt={WHY.mediaAlt}
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
        </figure>
      </div>
    </section>
  );
}
