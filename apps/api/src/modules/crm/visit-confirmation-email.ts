export type VisitConfirmationEmailInput = {
  recipientName: string;
  /** Full street address of the property being visited. */
  address: string;
  /** UTC ISO instant of the scheduled visit. */
  scheduledAt: string;
  /** IANA timezone used to render the local date/time (e.g. "America/Chicago"). */
  timezone: string;
};

export type VisitConfirmationEmail = {
  subject: string;
  html: string;
  text: string;
};

type FormattedSchedule = {
  date: string;
  time: string;
  timezoneLabel: string;
};

/**
 * Renders the local date, time and short timezone label for the visit.
 * Falls back to UTC formatting if the IANA zone is not recognised so a bad
 * timezone never crashes the email job.
 */
function formatSchedule(
  scheduledAt: string,
  timezone: string,
): FormattedSchedule {
  const instant = new Date(scheduledAt);

  try {
    const date = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(instant);

    const time = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(instant);

    const tzParts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      timeZoneName: "short",
    }).formatToParts(instant);

    const timezoneLabel =
      tzParts.find((part) => part.type === "timeZoneName")?.value ?? timezone;

    return { date, time, timezoneLabel };
  } catch {
    const date = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(instant);

    const time = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(instant);

    return { date, time, timezoneLabel: "UTC" };
  }
}

/**
 * Human-readable visit schedule summary for the lead activity timeline,
 * e.g. "Wednesday, July 1, 2026 at 3:00 PM CDT".
 */
export function formatVisitScheduleSummary(
  scheduledAt: string,
  timezone: string,
): string {
  const { date, time, timezoneLabel } = formatSchedule(scheduledAt, timezone);
  return `${date} at ${time} ${timezoneLabel}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Builds the visit confirmation email (Day 44). US English copy, US locale.
 * Subject mirrors the spec:
 *   "Your property visit is confirmed — {address}, {date} at {time} {timezone}"
 */
export function buildVisitConfirmationEmail(
  input: VisitConfirmationEmailInput,
): VisitConfirmationEmail {
  const { date, time, timezoneLabel } = formatSchedule(
    input.scheduledAt,
    input.timezone,
  );

  const subject = `Your property visit is confirmed — ${input.address}, ${date} at ${time} ${timezoneLabel}`;

  const greetingName = input.recipientName.trim() || "there";

  const text = [
    `Hi ${greetingName},`,
    "",
    "Your property visit is confirmed. Here are the details:",
    "",
    `Property: ${input.address}`,
    `Date: ${date}`,
    `Time: ${time} ${timezoneLabel}`,
    "",
    "If you need to reschedule, just reply to this email and our team will help.",
    "",
    "See you there!",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:32px 32px 8px;">
          <h1 style="margin:0 0 8px;font-size:20px;line-height:1.3;">Your visit is confirmed</h1>
          <p style="margin:0 0 16px;font-size:14px;color:#52525b;">Hi ${escapeHtml(greetingName)}, we look forward to seeing you.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;">
            <tr>
              <td style="padding:16px;font-size:14px;color:#71717a;width:90px;">Property</td>
              <td style="padding:16px;font-size:14px;font-weight:bold;">${escapeHtml(input.address)}</td>
            </tr>
            <tr>
              <td style="padding:16px;font-size:14px;color:#71717a;border-top:1px solid #e4e4e7;">Date</td>
              <td style="padding:16px;font-size:14px;font-weight:bold;border-top:1px solid #e4e4e7;">${escapeHtml(date)}</td>
            </tr>
            <tr>
              <td style="padding:16px;font-size:14px;color:#71717a;border-top:1px solid #e4e4e7;">Time</td>
              <td style="padding:16px;font-size:14px;font-weight:bold;border-top:1px solid #e4e4e7;">${escapeHtml(`${time} ${timezoneLabel}`)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;font-size:13px;color:#71717a;">
          Need to reschedule? Just reply to this email and our team will help.
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
