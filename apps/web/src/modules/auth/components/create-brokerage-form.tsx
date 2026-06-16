"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { SESSION_QUERY_KEY } from "@/hooks/use-session";
import { createBrokerage } from "@/lib/auth-client";
import { getAuthFormErrorMessage } from "@/modules/auth/lib/auth-form-error";

const schema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, "Brokerage name must be at least 2 characters.")
    .max(120, "Brokerage name is too long."),
});

type FormInput = z.infer<typeof schema>;

export function CreateBrokerageForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { organizationName: "" },
  });

  function onSubmit(values: FormInput) {
    startTransition(async () => {
      try {
        await createBrokerage(values);
        await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 400);
      } catch (error) {
        toast.error(
          getAuthFormErrorMessage(
            error,
            "Unable to create brokerage. Please try again.",
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
                  autoFocus
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
          {isPending ? "Creating brokerage…" : "Create brokerage"}
        </Button>
      </form>
    </Form>
  );
}
