import { z } from "zod";

export const createTestItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

export type CreateTestItemInput = z.infer<typeof createTestItemSchema>;
