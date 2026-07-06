import { FEATURES } from "../content";

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p data-animate className="text-primary text-sm font-semibold tracking-wide">
            The platform
          </p>
          <h2
            data-animate
            className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Everything your brokerage runs on
          </h2>
          <p data-animate className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
            One platform for listings, leads, search, and reporting — so your team stops
            juggling tools and starts closing.
          </p>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                data-animate
                className="border-border/60 bg-card/40 hover:border-border hover:bg-card/70 group rounded-xl border p-6 transition-colors"
              >
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
