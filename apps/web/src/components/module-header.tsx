type ModuleHeaderProps = {
  label: string;
  title: string;
  description: string;
};

export function ModuleHeader({ label, title, description }: ModuleHeaderProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
        {label}
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="text-sm leading-7 text-muted-foreground">{description}</p>
    </section>
  );
}
