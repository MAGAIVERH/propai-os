import fp from "fastify-plugin";

import { registerAuthModule } from "../modules/auth/index.js";

type AuthPluginOptions = {
  enabled?: boolean;
};

/**
 * Better Auth routes + brokerage extensions.
 * Full plugin extraction (T12-7) — behavior unchanged from Day 10–11.
 */
export const authPlugin = fp<AuthPluginOptions>(
  async (app, options) => {
    if (options.enabled === false) {
      return;
    }

    await registerAuthModule(app);
  },
  { name: "propai-auth" },
);
