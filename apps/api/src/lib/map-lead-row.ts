import type { LeadResponse } from "@propai/shared";

export type LeadRow = {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  source: LeadResponse["source"];
  assignedAgentId: string | null;
  propertyId: string | null;
  stageId: string | null;
  aiScore: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapLeadRow(row: LeadRow): LeadResponse {
  return {
    id: row.id,
    tenantId: row.tenantId,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    source: row.source,
    assignedAgentId: row.assignedAgentId,
    propertyId: row.propertyId,
    stageId: row.stageId,
    aiScore: row.aiScore,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
