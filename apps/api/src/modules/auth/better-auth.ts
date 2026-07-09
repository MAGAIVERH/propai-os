import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { organization as organizationPlugin } from "better-auth/plugins";

import {
  authSchema,
  getDb,
  getInitialOrganizationIdForUser,
  tenantSettings,
} from "@propai/db";

import { parseTrustedOrigins } from "../../lib/trusted-origins.js";
import { recordDevInvitation } from "../../lib/invitation-dev-store.js";
import {
  brokerageOrganizationAccess,
  brokerageOrganizationRoles,
} from "./organization-access.js";

const authSecret =
  process.env.BETTER_AUTH_SECRET ?? "dev-better-auth-secret-min-32-chars";

const authBaseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3333";

export const TRUSTED_ORIGINS = parseTrustedOrigins(process.env.TRUSTED_ORIGINS);

export const auth = betterAuth({
  secret: authSecret,
  baseURL: authBaseUrl,
  trustedOrigins: [...TRUSTED_ORIGINS],
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: authSchema,
  }),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const activeOrganizationId = await getInitialOrganizationIdForUser(
            session.userId,
          );

          return {
            data: {
              ...session,
              activeOrganizationId,
            },
          };
        },
      },
    },
  },
  plugins: [
    organizationPlugin({
      creatorRole: "owner",
      allowUserToCreateOrganization: true,
      ac: brokerageOrganizationAccess,
      roles: brokerageOrganizationRoles,
      requireEmailVerificationOnInvitation: false,
      async sendInvitationEmail(data) {
        const acceptPath = `/api/auth/organization/accept-invitation`;
        const acceptUrl = `${authBaseUrl}${acceptPath}`;

        recordDevInvitation({
          id: data.id,
          email: data.email,
          role: data.role,
          organizationId: data.organization.id,
          acceptPath,
        });

        if (process.env.NODE_ENV !== "production") {
          console.info(
            `[PropAI invite] email=${data.email} role=${data.role} org=${data.organization.name} invitationId=${data.id} accept=${acceptUrl} body={"invitationId":"${data.id}"}`,
          );
        }
      },
      organizationHooks: {
        afterCreateOrganization: async ({ organization: org }) => {
          await getDb()
            .insert(tenantSettings)
            .values({ organizationId: org.id })
            .onConflictDoNothing();
        },
      },
    }),
  ],
  advanced: {
    database: {
      generateId: "uuid",
    },
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  },
});
