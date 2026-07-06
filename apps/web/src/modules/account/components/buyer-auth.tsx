"use client";

import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { nameFromEmail, useBuyerSession } from "../use-buyer-session";

/** A premium labelled input with a leading icon and a focus ring. */
function AuthField({
  label,
  icon: Icon,
  type = "text",
  autoComplete,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  icon: typeof Mail;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const id = useId();
  const isPassword = type === "password";
  const [reveal, setReveal] = useState(false);
  const inputType = isPassword ? (reveal ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="group relative">
        <Icon
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 transition-colors group-focus-within:text-primary"
          aria-hidden="true"
        />
        <input
          id={id}
          type={inputType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "border-input bg-background w-full rounded-xl border py-2.5 pl-10 text-sm transition-shadow",
            "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-4 focus-visible:outline-none",
            isPassword ? "pr-10" : "pr-3.5",
          )}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-primary text-primary-foreground hover:bg-primary/90 mt-1 w-full rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-70"
    >
      {pending ? "One moment…" : label}
    </button>
  );
}

export function BuyerLoginForm() {
  const router = useRouter();
  const { signIn } = useBuyerSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setPending(true);
    const name = nameFromEmail(email);
    // Demo: no consumer backend — accept and persist the session.
    setTimeout(() => {
      signIn({ name, email });
      toast.success(`Welcome back, ${name}.`);
      router.push("/listings");
    }, 500);
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Sign in to save homes and book tours in one tap.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={setEmail}
          required
        />
        <AuthField
          label="Password"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          required
        />
        <SubmitButton pending={pending} label="Sign in" />
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        New to PropAI?{" "}
        <Link href="/account/register" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>
      <p className="text-muted-foreground/80 mt-8 text-center text-xs">
        Are you an agent?{" "}
        <Link href="/login" className="hover:text-foreground underline underline-offset-2">
          Agent login
        </Link>
      </p>
    </div>
  );
}

export function BuyerRegisterForm() {
  const router = useRouter();
  const { register } = useBuyerSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) return;
    setPending(true);
    const first = name.split(" ")[0] || name;
    setTimeout(() => {
      register({ name: first, email });
      toast.success(`Welcome, ${first}. Your account is ready.`);
      router.push("/listings");
    }, 500);
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Save your favorite homes, get new-listing alerts, and request tours with a
        single tap.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <AuthField
          label="Full name"
          icon={User}
          autoComplete="name"
          placeholder="Jane Buyer"
          value={name}
          onChange={setName}
          required
        />
        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={setEmail}
          required
        />
        <AuthField
          label="Password"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={password}
          onChange={setPassword}
          required
        />
        <SubmitButton pending={pending} label="Create account" />
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link href="/account/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
      <p className="text-muted-foreground/70 mt-8 text-center text-xs leading-relaxed">
        Demo account — no email is sent and details stay in your browser.
      </p>
    </div>
  );
}
