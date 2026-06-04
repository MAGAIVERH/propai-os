import { describe, expect, it } from "vitest";

import {
  BROKERAGE_ROLES,
  getPermissionsForRole,
  hasPermission,
  parseBrokerageRole,
  ROLE_PERMISSIONS,
} from "./permissions.js";

describe("hasPermission", () => {
  it("grants billing:manage to owner only among brokerage roles", () => {
    expect(hasPermission("owner", "billing:manage")).toBe(true);
    expect(hasPermission("manager", "billing:manage")).toBe(false);
    expect(hasPermission("agent", "billing:manage")).toBe(false);
    expect(hasPermission("viewer", "billing:manage")).toBe(false);
  });

  it("grants audit:read to owner and manager only", () => {
    expect(hasPermission("owner", "audit:read")).toBe(true);
    expect(hasPermission("manager", "audit:read")).toBe(true);
    expect(hasPermission("agent", "audit:read")).toBe(false);
    expect(hasPermission("viewer", "audit:read")).toBe(false);
  });

  it("denies analytics:read to agent and allows viewer", () => {
    expect(hasPermission("viewer", "analytics:read")).toBe(true);
    expect(hasPermission("agent", "analytics:read")).toBe(false);
    expect(hasPermission("owner", "analytics:read")).toBe(true);
    expect(hasPermission("manager", "analytics:read")).toBe(true);
  });

  it("allows leads:write for owner, manager, and agent", () => {
    expect(hasPermission("owner", "leads:write")).toBe(true);
    expect(hasPermission("manager", "leads:write")).toBe(true);
    expect(hasPermission("agent", "leads:write")).toBe(true);
    expect(hasPermission("viewer", "leads:write")).toBe(false);
  });

  it("allows properties:write for owner, manager, and agent", () => {
    expect(hasPermission("owner", "properties:write")).toBe(true);
    expect(hasPermission("manager", "properties:write")).toBe(true);
    expect(hasPermission("agent", "properties:write")).toBe(true);
    expect(hasPermission("viewer", "properties:write")).toBe(false);
  });

  it("matches ROLE_PERMISSIONS for every brokerage role", () => {
    for (const role of BROKERAGE_ROLES) {
      const permissions = getPermissionsForRole(role);

      expect(permissions).toEqual(ROLE_PERMISSIONS[role]);

      for (const permission of permissions) {
        expect(hasPermission(role, permission)).toBe(true);
      }
    }
  });
});

describe("parseBrokerageRole", () => {
  it("parses valid brokerage roles", () => {
    expect(parseBrokerageRole("owner")).toBe("owner");
    expect(parseBrokerageRole("manager")).toBe("manager");
    expect(parseBrokerageRole("agent")).toBe("agent");
    expect(parseBrokerageRole("viewer")).toBe("viewer");
  });

  it("returns null for invalid or legacy role strings", () => {
    expect(parseBrokerageRole("admin")).toBe(null);
    expect(parseBrokerageRole("member")).toBe(null);
    expect(parseBrokerageRole("")).toBe(null);
    expect(parseBrokerageRole("OWNER")).toBe(null);
    expect(parseBrokerageRole("unknown")).toBe(null);
  });
});
