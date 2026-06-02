import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

const authSecret =
  process.env.BETTER_AUTH_SECRET ?? "dev-better-auth-secret-min-32-chars";

const authBaseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3333";

/**
 * Better Auth instance (organization plugin enabled).
 * Database adapter lands when auth schema migrations ship; until then,
 * `auth.api.getSession` returns null unless a valid session cookie exists.
 */
export const auth = betterAuth({
  secret: authSecret,
  baseURL: authBaseUrl,
  plugins: [organization()],
});
