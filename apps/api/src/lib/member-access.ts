import { getMemberRoleForOrganization } from "@propai/db";
import {
  hasPermission,
  parseBrokerageRole,
  type BrokerageRole,
  type Permission,
} from "@propai/shared";

export type MemberAccessDeniedReason =
  | "not_member"
  | "invalid_role"
  | "forbidden";

export type MemberAccessResult =
  | { allowed: true; role: BrokerageRole }
  | { allowed: false; reason: MemberAccessDeniedReason };

export async function resolveMemberAccess(
  userId: string,
  organizationId: string,
  permission: Permission,
): Promise<MemberAccessResult> {
  const roleValue = await getMemberRoleForOrganization(userId, organizationId);

  if (!roleValue) {
    return { allowed: false, reason: "not_member" };
  }

  const role = parseBrokerageRole(roleValue);

  if (!role) {
    return { allowed: false, reason: "invalid_role" };
  }

  if (!hasPermission(role, permission)) {
    return { allowed: false, reason: "forbidden" };
  }

  return { allowed: true, role };
}

export function memberAccessDeniedMessage(
  reason: MemberAccessDeniedReason,
): string {
  switch (reason) {
    case "not_member":
      return "You are not a member of this organization.";
    case "invalid_role":
      return "Your organization role is not recognized.";
    case "forbidden":
      return "Insufficient permissions for this action.";
  }
}
