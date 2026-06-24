import { z } from "zod";

export const BROKERAGE_ROLES = [
  "owner",
  "manager",
  "agent",
  "viewer",
] as const;

export const brokerageRoleSchema = z.enum(BROKERAGE_ROLES);

export type BrokerageRole = z.infer<typeof brokerageRoleSchema>;

export const PERMISSIONS = [
  "leads:write",
  "properties:write",
  "analytics:read",
  "audit:read",
  "billing:manage",
] as const;

export const permissionSchema = z.enum(PERMISSIONS);

export type Permission = z.infer<typeof permissionSchema>;

export const ROLE_PERMISSIONS: Record<
  BrokerageRole,
  readonly Permission[]
> = {
  owner: [
    "leads:write",
    "properties:write",
    "analytics:read",
    "audit:read",
    "billing:manage",
  ],
  manager: ["leads:write", "properties:write", "analytics:read", "audit:read"],
  // Agents can read analytics, but the API scopes the data to their own leads.
  agent: ["leads:write", "properties:write", "analytics:read"],
  viewer: ["analytics:read"],
};

export function getPermissionsForRole(
  role: BrokerageRole,
): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(
  role: BrokerageRole,
  permission: Permission,
): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function parseBrokerageRole(value: string): BrokerageRole | null {
  const parsed = brokerageRoleSchema.safeParse(value);

  return parsed.success ? parsed.data : null;
}
