import { APP_NAME } from "@propai/shared";
import { Building2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PublicSessionRedirect } from "@/modules/auth/components/public-session-redirect";
import { SignUpForm } from "@/modules/auth/components/sign-up-form";

export default function SignUpPage() {
  return (
    <PublicSessionRedirect>
      <Card className="rounded-2xl border border-border">
        <CardHeader className="space-y-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Brokerage
          </p>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Create account
          </CardTitle>
          <CardDescription className="text-sm leading-7">
            Register your brokerage on {APP_NAME} and start managing your
            organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </PublicSessionRedirect>
  );
}
