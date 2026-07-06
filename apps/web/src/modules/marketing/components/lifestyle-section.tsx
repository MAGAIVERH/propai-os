import { LIFESTYLE } from "../content";

/**
 * Editorial photo mosaic with staggered reveals — mixed-size tiles inspired by
 * elyse-residence's amenity grid and FIND's lifestyle row. Pure SSR markup; the
 * reveal animation is driven by the shared LandingAnimations [data-animate] hook.
 */
export function LifestyleSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            data-animate
            className="font-display text-3xl font-light tracking-tight text-balance sm:text-4xl"
          >
            {LIFESTYLE.heading}
          </h2>
          <p data-animate className="text-muted-foreground mt-4 text-lg text-pretty">
            {LIFESTYLE.subheading}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {LIFESTYLE.tiles.map((tile, i) => (
            <figure
              key={tile.src}
              data-animate
              className={[
                "group border-border/60 relative overflow-hidden rounded-2xl border",
                // Alternating heights for a mosaic rhythm.
                i % 2 === 0 ? "aspect-[3/4]" : "aspect-[3/4] lg:mt-10",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tile.src}
                alt={tile.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-4 text-sm font-medium text-white sm:text-base">
                {tile.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
