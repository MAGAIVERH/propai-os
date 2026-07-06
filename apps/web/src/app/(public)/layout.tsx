import { AuthShell } from "@/modules/auth/components/auth-shell";

type PublicLayoutProps = {
  children: React.ReactNode;
};

/**
 * Brokerage/agent auth (login, signup, brokerage setup) presented in the shared
 * premium split-screen frame — a cinematic photo panel with proof on the left,
 * the form on the right.
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <AuthShell
      image="/listings/listing-08.jpg"
      imageAlt="An architectural home at golden hour"
      eyebrow="For brokerages"
      headline="The operating system behind modern brokerages."
      quote="PropAI replaced three tools. Our agents live in the pipeline and marketplace leads land instantly."
      quoteAuthor="Sarah Chen, Managing Broker"
    >
      {children}
    </AuthShell>
  );
}
