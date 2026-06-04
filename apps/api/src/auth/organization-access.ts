import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  ownerAc,
} from "better-auth/plugins/organization/access";

const ac = createAccessControl(defaultStatements);

/** Manager: member administration without invitation rights. */
const manager = ac.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: [],
  team: ["create", "update", "delete"],
  ac: ["create", "read", "update", "delete"],
});

/** Agent: read-only org plugin access (CRM permissions enforced in API middleware). */
const agent = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: ["read"],
});

/** Viewer: same plugin footprint as agent. */
const viewer = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: ["read"],
});

export const brokerageOrganizationAccess = ac;

export const brokerageOrganizationRoles = {
  owner: ownerAc,
  manager,
  agent,
  viewer,
} as const;
