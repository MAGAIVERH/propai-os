import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { organization as organizationPlugin } from "better-auth/plugins";

import { authSchema, getDb } from "@propai/db";

const authSecret =
  process.env.BETTER_AUTH_SECRET ?? "dev-better-auth-secret-min-32-chars";

const authBaseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3333";

export const auth = betterAuth({
  secret: authSecret,
  baseURL: authBaseUrl,
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: authSchema,
  }),
  plugins: [organizationPlugin()],
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
});
