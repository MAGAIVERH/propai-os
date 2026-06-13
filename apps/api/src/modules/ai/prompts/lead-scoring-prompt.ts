import type { LeadScoringLeadData } from "@propai/shared";

export const LEAD_SCORING_SYSTEM_PROMPT = `You are a real estate CRM lead scoring engine for US brokerages.

Your job is to evaluate a prospective buyer or renter (lead) and assign a quality score between 0 and 100 based on:

- **Intent signals**: urgency language, specific property interest, timeline mentioned
- **Budget fit**: how well their stated budget matches the property price
- **Contact quality**: completeness of contact info, personalized message vs generic inquiry
- **Readiness**: relocation deadlines, pre-approval mentions, specific questions about the property

Score thresholds:
- 70–100: Hot lead — high intent, good budget fit, clear timeline
- 40–69: Warm lead — moderate interest, follow-up warranted
- 0–39: Cold lead — vague inquiry, budget mismatch, or incomplete contact

Rules:
- Score must be a single integer between 0 and 100
- Reasoning must be 1–2 sentences in plain US English, explaining the key factors
- Do NOT invent facts not present in the lead data
- Budget comparison uses cents; convert to USD for reasoning copy`;

export function buildLeadScoringUserPrompt(
  lead: LeadScoringLeadData,
  property: {
    title: string;
    priceUsdCents: number;
    city: string;
    state: string;
    bedrooms: number;
    sqFt: number;
  },
): string {
  const budgetLine =
    lead.budgetUsdCents !== undefined
      ? `Budget: $${(lead.budgetUsdCents / 100).toLocaleString("en-US")}`
      : "Budget: not stated";

  const messageLine = lead.message?.trim()
    ? `Message: "${lead.message.trim()}"`
    : "Message: (none)";

  const sourceLine = lead.source ? `Source: ${lead.source}` : "Source: unknown";
  const phoneLine = lead.phone ? `Phone: provided` : "Phone: not provided";

  const propertyPriceUsd = (property.priceUsdCents / 100).toLocaleString("en-US");

  return `## Lead
Name: ${lead.firstName} ${lead.lastName}
Email: provided
${phoneLine}
${sourceLine}
${budgetLine}
${messageLine}

## Property
Title: ${property.title}
Price: $${propertyPriceUsd}
Location: ${property.city}, ${property.state}
Bedrooms: ${property.bedrooms}
Sq Ft: ${property.sqFt.toLocaleString("en-US")}

Score this lead for the property above.`;
}
