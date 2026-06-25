import { HOW_IT_WORKS } from "../content";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/20 scroll-mt-20 border-y border-border/60 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 data-animate className="text-3xl font-bold tracking-tight sm:text-4xl">
            From sign-up to closing in three steps
          </h2>
          <p data-animate className="text-muted-foreground mt-4 text-lg">
            A new brokerage can be productive in minutes — no external docs required.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.step}
                data-animate
                className="border-border/60 bg-card/50 relative rounded-xl border p-6"
              >
                <span className="text-muted-foreground/40 absolute right-5 top-4 text-4xl font-bold tabular-nums">
                  {step.step}
                </span>
                <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-lg">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
