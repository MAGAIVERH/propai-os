import { z } from "zod";

export const LEAD_PRIORITIES = ["hot", "warm", "cold"] as const;

export const leadPrioritySchema = z.enum(LEAD_PRIORITIES);

export type LeadPriority = z.infer<typeof leadPrioritySchema>;

export const leadScoringLeadDataSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().optional(),
  source: z.string().optional(),
  message: z.string().optional(),
  budgetUsdCents: z.number().int().min(0).optional(),
});

export type LeadScoringLeadData = z.infer<typeof leadScoringLeadDataSchema>;

export const scoreLeadRequestSchema = z.object({
  leadData: leadScoringLeadDataSchema,
  propertyId: z.uuid(),
});

export type ScoreLeadRequest = z.infer<typeof scoreLeadRequestSchema>;

export const scoreLeadResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  priority: leadPrioritySchema,
  reasoning: z.string(),
});

export type ScoreLeadResponse = z.infer<typeof scoreLeadResponseSchema>;

export const MOCK_LEAD_SCORING_RESULT = {
  score: 72,
  priority: "warm" as LeadPriority,
  reasoning:
    "Lead shows clear purchase intent with an urgent relocation timeline. Budget aligns well with the listing price.",
} satisfies ScoreLeadResponse;

export function derivePriority(score: number): LeadPriority {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}
