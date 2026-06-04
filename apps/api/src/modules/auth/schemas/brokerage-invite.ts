import { z } from "zod";

import { brokerageRoleSchema } from "@propai/shared";

export const invitableBrokerageRoleSchema = brokerageRoleSchema.exclude(["owner"]);

export const brokerageInviteSchema = z.object({
  email: z.email("E-mail inválido."),
  role: invitableBrokerageRoleSchema,
  organizationId: z.uuid().optional(),
  resend: z.boolean().optional(),
});

export type BrokerageInviteInput = z.infer<typeof brokerageInviteSchema>;
