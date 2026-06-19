import { describe, expect, it } from "vitest";

import { buildVisitConfirmationEmail } from "./visit-confirmation-email.js";

describe("buildVisitConfirmationEmail", () => {
  const base = {
    recipientName: "Jordan Smith",
    address: "123 Maple St, Austin, TX 78701",
    scheduledAt: "2026-07-01T20:00:00.000Z",
    timezone: "America/Chicago",
  };

  it("renders the subject in the spec format with localized date/time", () => {
    const email = buildVisitConfirmationEmail(base);

    // 20:00 UTC is 3:00 PM in America/Chicago (CDT).
    expect(email.subject).toBe(
      "Your property visit is confirmed — 123 Maple St, Austin, TX 78701, Wednesday, July 1, 2026 at 3:00 PM CDT",
    );
  });

  it("includes property, date and time in the text body", () => {
    const email = buildVisitConfirmationEmail(base);

    expect(email.text).toContain("Property: 123 Maple St, Austin, TX 78701");
    expect(email.text).toContain("Hi Jordan Smith,");
    expect(email.text).toContain("3:00 PM CDT");
  });

  it("escapes HTML in the address and recipient name", () => {
    const email = buildVisitConfirmationEmail({
      ...base,
      recipientName: "<b>x</b>",
      address: "1 A & B <St>",
    });

    expect(email.html).toContain("1 A &amp; B &lt;St&gt;");
    expect(email.html).not.toContain("<b>x</b>");
  });

  it("falls back to UTC when the timezone is invalid", () => {
    const email = buildVisitConfirmationEmail({
      ...base,
      timezone: "Not/AZone",
    });

    expect(email.subject).toContain("UTC");
    expect(email.subject).toContain("8:00 PM");
  });
});
