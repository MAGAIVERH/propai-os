export const DASHBOARD_PROTECTED_PREFIXES = [
  "/dashboard",
  "/properties",
  "/leads",
  "/visits",
  "/analytics",
  "/settings",
  "/profile",
] as const;

export function isProtectedDashboardPath(pathname: string): boolean {
  return DASHBOARD_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
