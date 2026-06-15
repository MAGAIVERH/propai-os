import { z } from "zod";

export const brokerageSignInSchema = z.object({
  email: z.email("A valid email address is required."),
  password: z.string().min(1, "Password is required."),
});

export type BrokerageSignInInput = z.infer<typeof brokerageSignInSchema>;
