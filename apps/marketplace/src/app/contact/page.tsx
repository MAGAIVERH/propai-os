import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the PropAI OS team about listings, partnerships, or support.",
};

const CHANNELS = [
  {
    label: "General inquiries",
    value: "hello@propai.example",
    href: "mailto:hello@propai.example",
  },
  {
    label: "Brokerage partnerships",
    value: "partners@propai.example",
    href: "mailto:partners@propai.example",
  },
  {
    label: "Support",
    value: "support@propai.example",
    href: "mailto:support@propai.example",
  },
];

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
      <p className="text-primary text-sm font-medium tracking-[0.18em] uppercase">Contact</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Let&apos;s talk</h1>
      <p className="text-muted-foreground mt-5 leading-7 text-pretty">
        Interested in a specific listing? Open it and use the &ldquo;Request a showing&rdquo; form —
        an agent will follow up directly. For everything else, reach us below.
      </p>

      <div className="mt-10 space-y-3">
        {CHANNELS.map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="rounded-card border-border bg-card hover:border-primary/60 flex items-center justify-between border p-5 transition-colors"
          >
            <span className="text-muted-foreground text-sm">{c.label}</span>
            <span className="text-primary font-medium">{c.value}</span>
          </a>
        ))}
      </div>
    </main>
  );
}
