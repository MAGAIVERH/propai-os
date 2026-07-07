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
export { analyticsEvents, analyticsEventTypeEnum } from "./analytics.js";
export { auditLogs } from "./audit-logs.js";
export {
  leadActivities,
  leadActivityTypeEnum,
  leads,
  pipelineStages,
  visits,
  visitStatusEnum,
} from "./crm.js";
export { notifications, notificationTypeEnum } from "./notifications.js";
export {
  properties,
  propertyFeatures,
  propertyImages,
  propertyStatusEnum,
  propertyTypeEnum,
  rentOrSaleEnum,
} from "./properties.js";
export { billingPlanEnum, stripeEvents, tenantSettings } from "./tenant-settings.js";
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
