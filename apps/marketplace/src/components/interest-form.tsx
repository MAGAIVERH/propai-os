"use client";

import { useState } from "react";

type InterestFormProps = {
  tenantId: string;
  propertyId: string;
  propertyTitle: string;
};

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; leadId: string }
  | { status: "error"; message: string };

export function InterestForm({ tenantId, propertyId, propertyTitle }: InterestFormProps) {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot — kept empty by humans, filled by bots.
  const [website, setWebsite] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "loading" });

    try {
      const res = await fetch(`${apiUrl}/public/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          propertyId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          message: message.trim() || undefined,
          website: website || undefined,
        }),
      });

      if (res.status === 429) {
        setState({
          status: "error",
          message: "You've sent several requests recently. Please try again shortly.",
        });
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setState({
          status: "error",
          message: body.message ?? "Something went wrong. Please try again.",
        });
        return;
      }

      const body = (await res.json()) as { leadId: string };
      setState({ status: "success", leadId: body.leadId });
    } catch {
      setState({
        status: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  }

  if (state.status === "success") {
    return (
      <div className="border-border rounded-2xl border bg-[#141414] p-6 text-center">
        <p className="mb-2 text-lg font-semibold">Request Received!</p>
        <p className="text-muted-foreground text-sm">
          An agent will reach out about <span className="text-foreground">{propertyTitle}</span>{" "}
          shortly.
        </p>
      </div>
    );
  }

  const isLoading = state.status === "loading";

  return (
    <div className="border-border rounded-2xl border bg-[#141414] p-6">
      <p className="mb-4 font-semibold">Request a Showing</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Honeypot: hidden from real users, ignored by screen readers. */}
        <div aria-hidden className="absolute top-[-9999px] left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-muted-foreground text-xs" htmlFor="firstName">
              First Name *
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border-border bg-background focus:border-primary rounded-lg border px-3 py-2 text-sm outline-none"
              placeholder="Jane"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-muted-foreground text-xs" htmlFor="lastName">
              Last Name *
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border-border bg-background focus:border-primary rounded-lg border px-3 py-2 text-sm outline-none"
              placeholder="Smith"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="email">
            Email *
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-border bg-background focus:border-primary rounded-lg border px-3 py-2 text-sm outline-none"
            placeholder="jane@example.com"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border-border bg-background focus:border-primary rounded-lg border px-3 py-2 text-sm outline-none"
            placeholder="(555) 000-1234"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border-border bg-background focus:border-primary resize-none rounded-lg border px-3 py-2 text-sm outline-none"
            placeholder="I'd like to schedule a tour for this weekend…"
            disabled={isLoading}
          />
        </div>

        {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Sending…" : "Send Request"}
        </button>
      </form>
    </div>
  );
}
