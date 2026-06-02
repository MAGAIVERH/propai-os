import {
  account,
  accountRelations,
  invitation,
  invitationRelations,
  member,
  memberRelations,
  organization,
  organizationRelations,
  session,
  sessionRelations,
  tenants,
  user,
  userRelations,
  verification,
} from "./auth.js";
export {
  account,
  accountRelations,
  invitation,
  invitationRelations,
  member,
  memberRelations,
  organization,
  organizationRelations,
  session,
  sessionRelations,
  tenants,
  user,
  userRelations,
  verification,
};
export { tenantSettings } from "./tenant-settings.js";
export { testItems } from "./test-items.js";

export const authSchema = {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
} as const;
