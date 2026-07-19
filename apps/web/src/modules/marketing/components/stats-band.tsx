import { STATS } from "../content";
import { StatCounter } from "./stat-counter";

/** Symmetric trust band — four evenly-weighted figures that count up on loop. */
export function StatsBand() {
  return (
    <section className="border-border bg-muted/40 border-y py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <dl className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} data-animate>
              <dt className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                <StatCounter value={stat.value} />
              </dt>
              <dd className="text-muted-foreground mt-2 text-sm">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
