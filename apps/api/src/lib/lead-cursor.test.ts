import { describe, expect, it } from "vitest";

import { decodeLeadCursor, encodeLeadCursor } from "./lead-cursor.js";

describe("lead cursor", () => {
  const cursor = {
    createdAt: new Date("2026-01-15T10:30:00.000Z"),
    id: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("encodes as ISO timestamp + separator + id", () => {
    expect(encodeLeadCursor(cursor)).toBe(
      "2026-01-15T10:30:00.000Z|550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("round-trips through encode → decode", () => {
    const decoded = decodeLeadCursor(encodeLeadCursor(cursor));

    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(cursor.id);
    expect(decoded?.createdAt.toISOString()).toBe(cursor.createdAt.toISOString());
  });

  it("returns null when there is no separator", () => {
    expect(decodeLeadCursor("no-separator-here")).toBeNull();
  });

  it("returns null when the separator is the first character (empty timestamp)", () => {
    expect(decodeLeadCursor("|some-id")).toBeNull();
  });

  it("returns null for an empty id", () => {
    expect(decodeLeadCursor("2026-01-15T10:30:00.000Z|")).toBeNull();
  });

  it("returns null for an invalid timestamp", () => {
    expect(decodeLeadCursor("not-a-date|some-id")).toBeNull();
  });

  it("splits on the last separator so ids are preserved intact", () => {
    // The ISO timestamp never contains '|', and lastIndexOf keeps the id whole.
    const decoded = decodeLeadCursor("2026-01-15T10:30:00.000Z|abc-123");

    expect(decoded?.id).toBe("abc-123");
  });
});
