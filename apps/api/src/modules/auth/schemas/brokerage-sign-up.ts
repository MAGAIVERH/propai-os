import { z } from "zod";

export const brokerageSignUpSchema = z.object({
  email: z.email("A valid email address is required."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(120, "Name is too long."),
  organizationName: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters.")
    .max(120, "Organization name is too long."),
});

export type BrokerageSignUpInput = z.infer<typeof brokerageSignUpSchema>;
