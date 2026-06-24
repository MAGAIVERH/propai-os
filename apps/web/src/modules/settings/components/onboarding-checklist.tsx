"use client";

import { CheckCircle2, Circle, X } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useCompleteOnboarding, useOnboarding } from "../hooks/use-settings";

type Step = {
  key: "agencyConfigured" | "agentInvited" | "propertyAdded";
  label: string;
  href: string;
  cta: string;
};

const STEPS: Step[] = [
  {
    key: "agencyConfigured",
    label: "Set up your agency details",
    href: "/settings/general",
    cta: "Configure",
  },
  {
    key: "agentInvited",
    label: "Invite your first agent",
    href: "/settings/team",
    cta: "Invite",
  },
  {
    key: "propertyAdded",
    label: "Add your first property",
    href: "/properties/new",
    cta: "Add",
  },
];

export function OnboardingChecklist() {
  const onboarding = useOnboarding();
  const complete = useCompleteOnboarding();

  if (onboarding.isPending || onboarding.isError || !onboarding.data) {
    return null;
  }

  const { steps, completed } = onboarding.data;
  const allDone = steps.agencyConfigured && steps.agentInvited && steps.propertyAdded;

  // Hide once the owner has explicitly completed onboarding.
  if (completed) return null;

  const doneCount = STEPS.filter((s) => steps[s.key]).length;

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Complete your setup{" "}
          <span className="text-muted-foreground text-sm font-normal">
            ({doneCount}/{STEPS.length})
          </span>
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dismiss setup checklist"
          onClick={() => complete.mutate()}
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {STEPS.map((step) => {
          const done = steps[step.key];
          return (
            <div
              key={step.key}
              className="border-border bg-card flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                {done ? (
                  <CheckCircle2 className="text-primary size-5" />
                ) : (
                  <Circle className="text-muted-foreground size-5" />
                )}
                <span className={done ? "text-muted-foreground line-through" : ""}>
                  {step.label}
                </span>
              </div>
              {!done && (
                <Link
                  href={step.href}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {step.cta}
                </Link>
              )}
            </div>
          );
        })}

        {allDone && (
          <Button
            className="mt-2 w-full"
            onClick={() => complete.mutate()}
            disabled={complete.isPending}
          >
            {complete.isPending ? "Finishing…" : "Finish setup"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
