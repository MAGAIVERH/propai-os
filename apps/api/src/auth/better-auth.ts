import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { organization as organizationPlugin } from "better-auth/plugins";

import {
  authSchema,
  getDb,
  getInitialOrganizationIdForUser,
  tenantSettings,
} from "@propai/db";

const authSecret =
  process.env.BETTER_AUTH_SECRET ?? "dev-better-auth-secret-min-32-chars";

const authBaseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3333";

export const TRUSTED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3333",
] as const;

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
