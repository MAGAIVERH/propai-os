import { z } from "zod";

export const propertyImageAnalysisSchema = z.object({
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().min(0),
  sqFt: z.number().int().positive(),
  features: z.array(z.string()),
  description: z.string(),
  seoTitle: z.string(),
  suggestedPriceUSD: z.number().int().min(0).nullable(),
});

export type PropertyImageAnalysis = z.infer<typeof propertyImageAnalysisSchema>;

export const analyzePropertyImagesRequestSchema = z.object({
  imageUrls: z.array(z.url()).min(1).max(10),
});

export type AnalyzePropertyImagesRequest = z.infer<typeof analyzePropertyImagesRequestSchema>;

export const analyzePropertyImagesResponseSchema = propertyImageAnalysisSchema;

export type AnalyzePropertyImagesResponse = z.infer<typeof analyzePropertyImagesResponseSchema>;

export const MOCK_PROPERTY_IMAGE_ANALYSIS = {
  bedrooms: 3,
  bathrooms: 2.5,
  sqFt: 1850,
  features: ["pool", "garage", "updated kitchen"],
  description:
    "Spacious single-family home with an open floor plan, private pool, and two-car garage in a quiet neighborhood.",
  seoTitle: "3BR Home with Pool & Garage — Move-In Ready",
  suggestedPriceUSD: 485_000,
} satisfies PropertyImageAnalysis;
