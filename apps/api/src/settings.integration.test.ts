import { randomUUID } from "node:crypto";

import type { OnboardingStatus, TeamListResponse, TenantSettingsResponse } from "@propai/shared";
import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

async function signUpOwner(app: Awaited<ReturnType<typeof buildApp>>) {
  const suffix = randomUUID().slice(0, 8);
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-sign-up",
    payload: {
      email: `settings-${suffix}@test.propai-os.local`,
      password: "password123",
      name: "Settings Owner",
      organizationName: `Settings Brokerage ${suffix}`,
    },
  });
  expect(res.statusCode).toBe(201);
  const cookie = normalizeCookieHeader(res.headers["set-cookie"]) ?? "";
  return { cookie, suffix };
}

describe("Phase 6 — settings/team/onboarding integration", () => {
  it("lists the team with the owner as the only active member", async () => {
    const app = await buildApp();
    const { cookie } = await signUpOwner(app);

    const res = await app.inject({
      method: "GET",
      url: "/v1/team",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const team = res.json() as TeamListResponse;
    expect(team.members.length).toBe(1);
    expect(team.members[0]?.role).toBe("owner");
    expect(team.members[0]?.status).toBe("active");

    await app.close();
  });

  it("reads and updates tenant settings (branding)", async () => {
    const app = await buildApp();
    const { cookie, suffix } = await signUpOwner(app);

    const getRes = await app.inject({
      method: "GET",
      url: "/v1/settings",
      headers: { cookie },
    });
    expect(getRes.statusCode).toBe(200);
    const settings = getRes.json() as TenantSettingsResponse;
    expect(settings.primaryColor).toBe("#10b981");
    expect(settings.timezone).toBe("America/New_York");

    const slug = `agency-${suffix}`;
    const patchRes = await app.inject({
      method: "PATCH",
      url: "/v1/settings",
      headers: { cookie, "content-type": "application/json" },
      payload: {
        primaryColor: "#2563eb",
        marketplaceSlug: slug,
        timezone: "America/Chicago",
      },
    });
    expect(patchRes.statusCode).toBe(200);
    const updated = patchRes.json() as TenantSettingsResponse;
    expect(updated.primaryColor).toBe("#2563eb");
    expect(updated.marketplaceSlug).toBe(slug);
    expect(updated.timezone).toBe("America/Chicago");

    await app.close();
  });

  it("tracks and completes onboarding", async () => {
    const app = await buildApp();
    const { cookie } = await signUpOwner(app);

    const before = await app.inject({
      method: "GET",
      url: "/v1/onboarding",
      headers: { cookie },
    });
    expect(before.statusCode).toBe(200);
    const beforeStatus = before.json() as OnboardingStatus;
    expect(beforeStatus.completed).toBe(false);
    expect(beforeStatus.steps.propertyAdded).toBe(false);

    const complete = await app.inject({
      method: "POST",
      url: "/v1/onboarding/complete",
      headers: { cookie },
    });
    expect(complete.statusCode).toBe(200);
    const afterStatus = complete.json() as OnboardingStatus;
    expect(afterStatus.completed).toBe(true);
    expect(afterStatus.steps.agencyConfigured).toBe(true);

    await app.close();
  });
});
