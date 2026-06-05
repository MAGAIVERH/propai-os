import type { BrokerageRole } from "@propai/shared";

export type PropertyAccessDeniedReason = "not_found" | "forbidden";

export type PropertyListScope = "all" | "assigned";

export type PropertyAccessResult =
  | { allowed: true; scope: PropertyListScope }
  | { allowed: false; reason: PropertyAccessDeniedReason };

export type PropertyAccessSubject = {
  createdBy: string | null;
  softDeletedAt: Date | null;
};

/** Agents see only listings they created; managers and owners see the full tenant. */
export function resolveListScope(role: BrokerageRole): PropertyListScope {
  if (role === "agent") {
    return "assigned";
  }

  return "all";
}

export function assertPropertyAccess(
  role: BrokerageRole,
  userId: string,
  property: PropertyAccessSubject | null | undefined,
): PropertyAccessResult {
  if (!property || property.softDeletedAt !== null) {
    return { allowed: false, reason: "not_found" };
  }

  if (role === "owner" || role === "manager") {
    return { allowed: true, scope: "all" };
  }

  if (role === "agent") {
    if (property.createdBy !== userId) {
      return { allowed: false, reason: "not_found" };
    }

    return { allowed: true, scope: "assigned" };
  }

  return { allowed: false, reason: "forbidden" };
}
