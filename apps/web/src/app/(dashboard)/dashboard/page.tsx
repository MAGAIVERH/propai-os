export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
          Module
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">
          Welcome to your brokerage workspace. Property management will be
          available in an upcoming release.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Use the sidebar to navigate. Properties and listings will appear here
          once the module is enabled.
        </p>
      </section>
    </div>
  );
}
