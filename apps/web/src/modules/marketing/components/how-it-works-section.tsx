import { HOW_IT_WORKS } from "../content";

/**
 * Symmetric three-step process — evenly sized numbered cards.
 */
export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-24 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p data-animate className="text-primary text-sm font-semibold tracking-wide">
            How it works
          </p>
          <h2
            data-animate
            className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            From first search to signed close
          </h2>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <li
              key={step.step}
              data-animate
              className="border-border bg-card flex flex-col rounded-2xl border p-8"
            >
              <span className="text-primary text-sm font-semibold tabular-nums">
                {step.step}
              </span>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
