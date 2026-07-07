import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Optional small uppercase label above the title. */
  eyebrow?: string;
  /** Optional back link rendered above the title (detail pages). */
  back?: { label: string; href: string };
  /** Right-aligned actions (e.g. a primary button). */
  actions?: React.ReactNode;
};

/**
 * Clean, consistent page header for dashboard modules — a title, optional
 * description, back link, and a right-aligned action slot. Replaces the heavier
 * boxed ModuleHeader for a calmer, more premium feel.
 */
export function PageHeader({ title, description, eyebrow, back, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {back ? (
          <Link
            href={back.href}
            className="text-muted-foreground hover:text-foreground -mb-0.5 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {back.label}
          </Link>
        ) : eyebrow ? (
          <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-foreground truncate text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
