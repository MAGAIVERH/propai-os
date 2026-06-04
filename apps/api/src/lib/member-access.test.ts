import { describe, expect, it, vi, beforeEach } from "vitest";

import * as db from "@propai/db";

import {
  memberAccessDeniedMessage,
  resolveMemberAccess,
} from "./member-access.js";

vi.mock("@propai/db", () => ({
  getMemberRoleForOrganization: vi.fn(),
}));

describe("resolveMemberAccess", () => {
  beforeEach(() => {
    vi.mocked(db.getMemberRoleForOrganization).mockReset();
  });

  it("allows owner for audit:read", async () => {
    vi.mocked(db.getMemberRoleForOrganization).mockResolvedValue("owner");

    const result = await resolveMemberAccess(
      "user-1",
      "org-1",
      "audit:read",
    );

    expect(result).toEqual({ allowed: true, role: "owner" });
  });

  it("allows manager for audit:read", async () => {
    vi.mocked(db.getMemberRoleForOrganization).mockResolvedValue("manager");

    const result = await resolveMemberAccess(
      "user-1",
      "org-1",
      "audit:read",
    );

    expect(result).toEqual({ allowed: true, role: "manager" });
  });

  it("denies agent and viewer for audit:read", async () => {
    vi.mocked(db.getMemberRoleForOrganization).mockResolvedValue("agent");

    expect(
      await resolveMemberAccess("user-1", "org-1", "audit:read"),
    ).toEqual({ allowed: false, reason: "forbidden" });

    vi.mocked(db.getMemberRoleForOrganization).mockResolvedValue("viewer");

    expect(
      await resolveMemberAccess("user-1", "org-1", "audit:read"),
    ).toEqual({ allowed: false, reason: "forbidden" });
  });

  it("returns not_member when role lookup is empty", async () => {
    vi.mocked(db.getMemberRoleForOrganization).mockResolvedValue(null);

    const result = await resolveMemberAccess(
      "user-1",
      "org-1",
      "audit:read",
    );

    expect(result).toEqual({ allowed: false, reason: "not_member" });
    expect(memberAccessDeniedMessage("not_member")).toContain("member");
  });
});
