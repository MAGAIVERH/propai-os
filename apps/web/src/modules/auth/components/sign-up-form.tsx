"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpBrokerage } from "@/lib/auth-client";
import { getAuthFormErrorMessage } from "@/modules/auth/lib/auth-form-error";
import {
  brokerageSignUpSchema,
  type BrokerageSignUpInput,
} from "@/modules/auth/schemas/sign-up";

export function SignUpForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<BrokerageSignUpInput>({
    resolver: zodResolver(brokerageSignUpSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      organizationName: "",
    },
  });

  function onSubmit(values: BrokerageSignUpInput) {
    startTransition(async () => {
      try {
        await signUpBrokerage(values);

        // Hard navigation so the new session cookie reaches the proxy gate on
        // the next request — dashboard renders first try, no manual refresh.
        window.location.assign("/dashboard");
      } catch (error) {
        toast.error(
          getAuthFormErrorMessage(
            error,
            "Unable to create your account. Check that the API is running (pnpm dev) and try again.",
          ),
        );
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Owner"
                  className="rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brokerage name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="organization"
                  placeholder="Acme Brokerage"
                  className="rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@brokerage.com"
                  className="rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full rounded-xl"
          disabled={isPending}
        >
          {isPending ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}
