/** Converts a brokerage name into a URL-safe organization slug. */
export function slugifyOrganizationName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length === 0) {
    return "brokerage";
  }

  return slug.slice(0, 64);
}
