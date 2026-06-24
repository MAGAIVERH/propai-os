export type LegalSection = {
  heading: string;
  body: string;
};

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
      <p className="text-primary text-sm font-medium tracking-[0.18em] uppercase">Legal</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 text-xs">Last updated: {updated}</p>
      <p className="text-muted-foreground mt-6 leading-7 text-pretty">{intro}</p>

      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold">{s.heading}</h2>
            <p className="text-muted-foreground mt-2 leading-7 text-pretty">{s.body}</p>
          </section>
        ))}
      </div>

      <p className="rounded-card border-border bg-card text-muted-foreground mt-12 border p-4 text-xs">
        This is a demonstration document for the PropAI OS marketplace and is not legal advice.
        Production deployments should review all policies with qualified counsel.
      </p>
    </main>
  );
}
