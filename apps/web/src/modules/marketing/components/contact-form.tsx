"use client";

import { Check } from "lucide-react";
import { useState } from "react";

/**
 * Contact form for the marketing site. Portfolio demo — there is no inbound
 * backend, so this validates client-side and shows an inline confirmation.
 */
export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="border-border bg-muted/40 flex flex-col items-center rounded-3xl border p-10 text-center">
        <span className="bg-primary/10 text-primary inline-flex size-12 items-center justify-center rounded-full">
          <Check className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-lg font-semibold">Thanks — message received.</p>
        <p className="text-muted-foreground mt-2 text-sm">
          An agent will get back to you shortly. (This is a demo, so no email is
          actually sent.)
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="border-border bg-card space-y-5 rounded-3xl border p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Full name" autoComplete="name" required />
        <Field id="email" label="Email" type="email" autoComplete="email" required />
      </div>
      <Field id="phone" label="Phone (optional)" type="tel" autoComplete="tel" />
      <div>
        <label htmlFor="interest" className="mb-1.5 block text-sm font-medium">
          I&apos;m interested in
        </label>
        <select
          id="interest"
          name="interest"
          defaultValue="Buying a home"
          className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <option>Buying a home</option>
          <option>Selling a home</option>
          <option>Renting a home</option>
          <option>Investing</option>
          <option>Running my brokerage on PropAI</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          placeholder="Tell us a little about what you're looking for…"
          className="border-input bg-background focus-visible:ring-ring w-full resize-y rounded-lg border px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
      </div>
      <button
        type="submit"
        className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-full px-5 py-3 text-sm font-medium transition-colors"
      >
        Send message
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
      />
    </div>
  );
}
