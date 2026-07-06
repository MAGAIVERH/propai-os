"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { NEWSLETTER } from "../content";

type NewsletterFormProps = {
  /** "underline" is the dark-footer treatment; default is a boxed input. */
  variant?: "default" | "underline";
};

/**
 * Newsletter signup. Portfolio demo — there is no mailing-list backend, so this
 * validates the email client-side and shows an inline confirmation only.
 */
export function NewsletterForm({ variant = "default" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  const underline = variant === "underline";

  if (submitted) {
    return (
      <p
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium",
          underline ? "text-white" : "text-success",
        )}
      >
        <Check className="size-4" aria-hidden="true" />
        {NEWSLETTER.success}
      </p>
    );
  }

  if (underline) {
    return (
      <form onSubmit={handleSubmit} className="relative w-full max-w-md">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          placeholder={NEWSLETTER.placeholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full border-b border-white/30 bg-transparent py-3 pr-10 text-white placeholder:text-white/40 focus:border-white focus:outline-none"
        />
        <button
          type="submit"
          aria-label={NEWSLETTER.cta}
          className="absolute top-1/2 right-0 -translate-y-1/2 text-white/70 transition-colors hover:text-white"
        >
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        placeholder={NEWSLETTER.placeholder}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="border-input bg-background focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
      />
      <button
        type="submit"
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-5 py-2 text-sm font-medium transition-colors"
      >
        {NEWSLETTER.cta}
      </button>
    </form>
  );
}
