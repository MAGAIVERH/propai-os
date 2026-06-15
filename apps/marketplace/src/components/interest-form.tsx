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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "loading" });

    try {
      const res = await fetch(`${apiUrl}/public/interest`, {
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
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        setState({ status: "error", message: body.message ?? "Something went wrong. Please try again." });
        return;
      }

      const body = await res.json() as { leadId: string };
      setState({ status: "success", leadId: body.leadId });
    } catch {
      setState({ status: "error", message: "Network error. Please check your connection and try again." });
    }
  }

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-[#141414] p-6 text-center">
        <p className="mb-2 text-lg font-semibold">Request Received!</p>
        <p className="text-sm text-muted-foreground">
          An agent will reach out about <span className="text-foreground">{propertyTitle}</span> shortly.
        </p>
      </div>
    );
  }

  const isLoading = state.status === "loading";

  return (
    <div className="rounded-2xl border border-border bg-[#141414] p-6">
      <p className="mb-4 font-semibold">Request a Showing</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="firstName">
              First Name *
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Jane"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="lastName">
              Last Name *
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Smith"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground" htmlFor="email">
            Email *
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="jane@example.com"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="(555) 000-1234"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground" htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="I'd like to schedule a tour for this weekend…"
            disabled={isLoading}
          />
        </div>

        {state.status === "error" && (
          <p className="text-sm text-red-400">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Sending…" : "Send Request"}
        </button>
      </form>
    </div>
  );
}
