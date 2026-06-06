import { APP_NAME } from "@propai/shared";
import { LogIn } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/modules/auth/components/login-form";
import { PublicSessionRedirect } from "@/modules/auth/components/public-session-redirect";

export default function LoginPage() {
  return (
    <PublicSessionRedirect>
      <Card className="rounded-2xl border border-border">
        <CardHeader className="space-y-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <LogIn className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Account
          </p>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Sign in
          </CardTitle>
          <CardDescription className="text-sm leading-7">
            Access your {APP_NAME} dashboard with your brokerage credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </PublicSessionRedirect>
  );
}
