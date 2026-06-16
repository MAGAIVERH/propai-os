import { z } from "zod";

export const brokerageCreateOrganizationSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters.")
    .max(120, "Organization name is too long."),
});

export type BrokerageCreateOrganizationInput = z.infer<
  typeof brokerageCreateOrganizationSchema
>;
