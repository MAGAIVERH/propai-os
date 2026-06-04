import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { normalizeCookieHeader } from "./lib/forward-auth-cookies.js";

type BrokerageSignUpResponse = {
  user: { id: string; email: string };
  organization: { id: string; slug: string };
  session: { activeOrganizationId: string };
};

type TestItemResponse = {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
};

type TestItemsListResponse = {
  items: TestItemResponse[];
};

type CreateTestItemResponse = {
  item: TestItemResponse;
};

async function brokerageSignUp(
  app: Awaited<ReturnType<typeof buildApp>>,
  suffix: string,
  label: "a" | "b",
): Promise<{
  email: string;
  organizationId: string;
  cookie: string;
}> {
  const email = `tenant-${label}-${suffix}@test.propai-os.local`;
  const organizationName = `Isolation Brokerage ${label.toUpperCase()} ${suffix}`;

  const response = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-sign-up",
    payload: {
      email,
      password: "password123",
      name: `Owner ${label.toUpperCase()}`,
      organizationName,
    },
  });

  expect(response.statusCode).toBe(201);

  const body = response.json() as BrokerageSignUpResponse;
  const cookie = normalizeCookieHeader(response.headers["set-cookie"]);

  expect(cookie).toBeDefined();
  expect(body.session.activeOrganizationId).toBe(body.organization.id);

  return {
    email,
    organizationId: body.organization.id,
    cookie: cookie ?? "",
  };
}

describe("Auth tenant isolation (two orgs)", () => {
  it("keeps test-items scoped per organization session", async () => {
    const app = await buildApp();
    const suffix = randomUUID().slice(0, 8);

    const tenantA = await brokerageSignUp(app, suffix, "a");
    const tenantB = await brokerageSignUp(app, suffix, "b");

    const createAResponse = await app.inject({
      method: "POST",
      url: "/v1/test-items",
      headers: {
        cookie: tenantA.cookie,
        "content-type": "application/json",
      },
      payload: { name: "A-only" },
    });

    expect(createAResponse.statusCode).toBe(201);

    const createABody = createAResponse.json() as CreateTestItemResponse;

    expect(createABody.item.name).toBe("A-only");
    expect(createABody.item.tenantId).toBe(tenantA.organizationId);

    const createBResponse = await app.inject({
      method: "POST",
      url: "/v1/test-items",
      headers: {
        cookie: tenantB.cookie,
        "content-type": "application/json",
      },
      payload: { name: "B-only" },
    });

    expect(createBResponse.statusCode).toBe(201);

    const createBBody = createBResponse.json() as CreateTestItemResponse;

    expect(createBBody.item.name).toBe("B-only");
    expect(createBBody.item.tenantId).toBe(tenantB.organizationId);

    const listAResponse = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: { cookie: tenantA.cookie },
    });

    expect(listAResponse.statusCode).toBe(200);

    const listABody = listAResponse.json() as TestItemsListResponse;

    expect(listABody.items).toHaveLength(1);
    expect(listABody.items[0]?.name).toBe("A-only");
    expect(listABody.items[0]?.tenantId).toBe(tenantA.organizationId);
    expect(
      listABody.items.every((item) => item.tenantId === tenantA.organizationId),
    ).toBe(true);

    const listBResponse = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: { cookie: tenantB.cookie },
    });

    expect(listBResponse.statusCode).toBe(200);

    const listBBody = listBResponse.json() as TestItemsListResponse;

    expect(listBBody.items).toHaveLength(1);
    expect(listBBody.items[0]?.name).toBe("B-only");
    expect(listBBody.items[0]?.tenantId).toBe(tenantB.organizationId);
    expect(
      listBBody.items.every((item) => item.tenantId === tenantB.organizationId),
    ).toBe(true);

    expect(tenantA.organizationId).not.toBe(tenantB.organizationId);
    expect(listABody.items.some((item) => item.name === "B-only")).toBe(false);
    expect(listBBody.items.some((item) => item.name === "A-only")).toBe(false);

    await app.close();
  });
});
