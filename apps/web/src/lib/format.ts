/**
 * Shared en-US formatting helpers. Keeps the product feeling native to the US
 * market (dates MM/DD/YYYY, USD, sq ft, US phone numbers).
 */

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Format a USD amount given in cents, e.g. 62500000 -> "$625,000". */
export function formatUsdFromCents(cents: number): string {
  return usdFormatter.format(cents / 100);
}

/** Format an ISO date as a US short date, e.g. "Jun 25, 2026". */
export function formatUsDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * Progressively format a US phone number as the user types:
 * "5551234567" -> "(555) 123-4567". A leading country code "1" is dropped.
 * Non-digits are ignored; partial input formats gracefully.
 */
export function formatUsPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);

  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  const line = digits.slice(6, 10);

  if (digits.length <= 3) return area;
  if (digits.length <= 6) return `(${area}) ${prefix}`;
  return `(${area}) ${prefix}-${line}`;
}
