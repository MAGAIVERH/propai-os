import { randomUUID } from "node:crypto";

import { buildApp } from "../src/app.js";
import { normalizeCookieHeader } from "../src/lib/forward-auth-cookies.js";

type SmokeResult = {
  name: string;
  passed: boolean;
  detail: string;
};

type BrokerageSignUpBody = {
  organization: { id: string };
  session: { activeOrganizationId: string };
};

type TestItemsListBody = {
  items: Array<{ name: string; tenantId: string }>;
};

type InvitationBody = {
  invitation: { id: string; organizationId: string; status: string };
};

type SessionBody = {
  session: { activeOrganizationId: string | null } | null;
};

const AUTH_ORIGIN = "http://localhost:3333";

function authHeaders(cookie?: string): Record<string, string> {
  const headers: Record<string, string> = {
    origin: AUTH_ORIGIN,
  };

  if (cookie) {
    headers.cookie = cookie;
  }

  return headers;
}

function record(
  results: SmokeResult[],
  name: string,
  passed: boolean,
  detail: string,
): void {
  results.push({ name, passed, detail });
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function brokerageSignUp(
  app: Awaited<ReturnType<typeof buildApp>>,
  email: string,
  organizationName: string,
): Promise<{ organizationId: string; cookie: string }> {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/brokerage-sign-up",
    headers: {
      ...authHeaders(),
      "content-type": "application/json",
    },
    payload: {
      email,
      password: "password123",
      name: "Smoke Owner",
      organizationName,
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(`sign-up ${email} returned ${response.statusCode}`);
  }

  const body = response.json() as BrokerageSignUpBody;
  const cookie = normalizeCookieHeader(response.headers["set-cookie"]);

  if (!cookie) {
    throw new Error(`sign-up ${email} missing session cookie`);
  }

  return {
    organizationId: body.organization.id,
    cookie,
  };
}

async function main(): Promise<void> {
  const results: SmokeResult[] = [];
  const suffix = randomUUID().slice(0, 8);
  const app = await buildApp();

  try {
    const tenantA = await brokerageSignUp(
      app,
      `smoke-a-${suffix}@test.propai-os.local`,
      `Smoke Brokerage A ${suffix}`,
    );

    const createA = await app.inject({
      method: "POST",
      url: "/v1/test-items",
      headers: {
        cookie: tenantA.cookie,
        "content-type": "application/json",
      },
      payload: { name: "smoke-a-only" },
    });

    record(
      results,
      "Owner A sign-up + create item",
      createA.statusCode === 201,
      createA.statusCode === 201
        ? `item tenant ${(createA.json() as { item: { tenantId: string } }).item.tenantId}`
        : `status ${createA.statusCode}`,
    );

    const agentEmail = `smoke-agent-${suffix}@test.propai-os.local`;

    const invite = await app.inject({
      method: "POST",
      url: "/api/auth/brokerage-invite",
      headers: {
        ...authHeaders(tenantA.cookie),
        "content-type": "application/json",
      },
      payload: { email: agentEmail, role: "agent" },
    });

    const inviteBody =
      invite.statusCode === 201
        ? (invite.json() as InvitationBody)
        : null;

    record(
      results,
      "Owner invites agent (pending)",
      invite.statusCode === 201 &&
        inviteBody?.invitation.status === "pending" &&
        inviteBody.invitation.organizationId === tenantA.organizationId,
      invite.statusCode === 201
        ? `invitation ${inviteBody?.invitation.id ?? "missing"}`
        : `status ${invite.statusCode}`,
    );

    if (inviteBody?.invitation.id) {
      const agentSignUp = await app.inject({
        method: "POST",
        url: "/api/auth/sign-up/email",
        headers: {
          ...authHeaders(),
          "content-type": "application/json",
        },
        payload: {
          email: agentEmail,
          password: "password123",
          name: "Smoke Agent",
        },
      });

      const agentCookie = normalizeCookieHeader(
        agentSignUp.headers["set-cookie"],
      );

      const accept =
        agentSignUp.statusCode === 200 && agentCookie
          ? await app.inject({
              method: "POST",
              url: "/api/auth/organization/accept-invitation",
              headers: {
                ...authHeaders(agentCookie),
                "content-type": "application/json",
              },
              payload: { invitationId: inviteBody.invitation.id },
            })
          : null;

      const acceptDetail =
        accept && accept.statusCode !== 200
          ? JSON.stringify(accept.json())
          : `status ${accept?.statusCode ?? agentSignUp.statusCode}`;

      const acceptCookie = accept
        ? (normalizeCookieHeader(accept.headers["set-cookie"]) ?? agentCookie)
        : null;

      const session =
        accept?.statusCode === 200 && acceptCookie
          ? await app.inject({
              method: "GET",
              url: "/api/auth/get-session",
              headers: authHeaders(acceptCookie),
            })
          : null;

      const sessionBody =
        session?.statusCode === 200
          ? (session.json() as SessionBody)
          : null;

      const acceptOk =
        accept?.statusCode === 200 &&
        sessionBody?.session?.activeOrganizationId === tenantA.organizationId;

      record(
        results,
        "Agent accepts invitation",
        acceptOk,
        acceptOk
          ? `activeOrganizationId=${sessionBody?.session?.activeOrganizationId}`
          : acceptDetail,
      );

      if (acceptCookie) {
        const agentItems = await app.inject({
          method: "GET",
          url: "/v1/test-items",
          headers: { cookie: acceptCookie },
        });

        const agentBody = agentItems.json() as TestItemsListBody;
        const agentScopeOk =
          agentItems.statusCode === 200 &&
          agentBody.items.some((item) => item.name === "smoke-a-only") &&
          !agentBody.items.some((item) => item.name === "smoke-b-only") &&
          agentBody.items.every(
            (item) => item.tenantId === tenantA.organizationId,
          );

        record(
          results,
          "Agent test-items scoped to org A",
          agentScopeOk,
          agentScopeOk
            ? `${agentBody.items.length} item(s) in tenant A`
            : `status ${agentItems.statusCode}`,
        );
      }
    } else {
      record(results, "Agent accepts invitation", false, "skipped — no invitation id");
      record(results, "Agent test-items scoped to org A", false, "skipped — invite failed");
    }

    const tenantB = await brokerageSignUp(
      app,
      `smoke-b-${suffix}@test.propai-os.local`,
      `Smoke Brokerage B ${suffix}`,
    );

    await app.inject({
      method: "POST",
      url: "/v1/test-items",
      headers: {
        cookie: tenantB.cookie,
        "content-type": "application/json",
      },
      payload: { name: "smoke-b-only" },
    });

    const listA = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: { cookie: tenantA.cookie },
    });

    const listB = await app.inject({
      method: "GET",
      url: "/v1/test-items",
      headers: { cookie: tenantB.cookie },
    });

    const bodyA = listA.json() as TestItemsListBody;
    const bodyB = listB.json() as TestItemsListBody;

    const isolationOk =
      listA.statusCode === 200 &&
      listB.statusCode === 200 &&
      bodyA.items.some((item) => item.name === "smoke-a-only") &&
      bodyB.items.length === 1 &&
      bodyB.items[0]?.name === "smoke-b-only" &&
      bodyA.items.every((item) => item.tenantId === tenantA.organizationId) &&
      bodyB.items.every((item) => item.tenantId === tenantB.organizationId) &&
      !bodyA.items.some((item) => item.name === "smoke-b-only") &&
      !bodyB.items.some((item) => item.name === "smoke-a-only");

    record(
      results,
      "Dual sign-up tenant isolation",
      isolationOk,
      isolationOk
        ? "each org sees only its own test-items"
        : `A=${bodyA.items.length} B=${bodyB.items.length}`,
    );

    const unauth = await app.inject({
      method: "GET",
      url: "/v1/test-items",
    });

    record(
      results,
      "Unauthenticated GET /v1/test-items",
      unauth.statusCode === 401,
      `status ${unauth.statusCode}`,
    );
  } catch (error: unknown) {
    record(results, "Smoke runner", false, formatError(error));
  } finally {
    await app.close();
  }

  const failed = results.filter((result) => !result.passed);

  console.log("\nPropAI Auth POC smoke — Day 11\n");

  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";
    console.log(`[${status}] ${result.name} — ${result.detail}`);
  }

  console.log("");

  if (failed.length > 0) {
    process.exitCode = 1;
    throw new Error(`${failed.length} smoke check(s) failed`);
  }

  console.log("All Auth POC smoke checks passed.\n");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
