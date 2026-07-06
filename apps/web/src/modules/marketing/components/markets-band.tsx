import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { MARKETS } from "../content";

/**
 * "Explore by market" — premium portrait cards for the country's most coveted
 * addresses, tying back to the cities in the hero reveal. Photography-led, with
 * a hover zoom; a distinct format from the full-bleed video so the page never
 * feels repetitive.
 */
export function MarketsBand() {
  return (
    <section id="markets" className="bg-muted/30 scroll-mt-20 py-24 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p data-animate className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
              Explore by market
            </p>
            <h2 data-animate className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Find your place in the country&rsquo;s most coveted addresses
            </h2>
          </div>
        </div>

        {/* On large screens the row behaves like an accordion: the hovered card
            widens while its neighbours narrow. Below lg it's a simple grid. */}
        <ul className="group/markets mt-12 grid grid-cols-2 gap-5 lg:flex lg:items-stretch">
          {MARKETS.map((market) => (
            <li
              key={market.name}
              data-animate
              className="lg:flex-1 lg:transition-[flex-grow] lg:duration-500 lg:ease-out lg:group-hover/markets:flex-[0.7] lg:hover:!flex-[2.4]"
            >
              <Link
                href={`/listings?market=${encodeURIComponent(market.name)}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-2xl shadow-sm transition-shadow duration-500 hover:shadow-2xl lg:aspect-auto lg:h-[480px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={market.src}
                  alt={market.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-110"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-[0.7rem] font-medium tracking-[0.18em] text-white/75 uppercase">
                    {market.count}
                  </p>
                  <h3 className="mt-1.5 flex items-center justify-between gap-2 text-2xl font-semibold tracking-tight whitespace-nowrap">
                    {market.name}
                    <ArrowUpRight
                      className="size-5 shrink-0 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="text-sm text-white/80">{market.tagline}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
