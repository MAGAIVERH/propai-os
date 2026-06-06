import { type NextRequest, NextResponse } from "next/server";

const DEFAULT_API_URL = "http://localhost:3333";

const PROTECTED_PREFIX = "/dashboard";
const AUTH_PATHS = new Set(["/login", "/signup"]);

/**
 * Edge middleware — resolves session via API fetch only (no Node-only APIs).
 * Forwards browser cookies to Better Auth `GET /api/auth/get-session`.
 */
function getMiddlewareApiUrl(): string {
  return (
    process.env.API_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_URL?.trim() ??
    DEFAULT_API_URL
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasAuthenticatedSession(body: unknown): boolean {
  if (!isRecord(body)) {
    return false;
  }

  const session = body.session;
  const user = body.user;

  if (!isRecord(session) || !isRecord(user)) {
    return false;
  }

  return typeof user.id === "string" && typeof session.id === "string";
}

async function fetchHasSession(request: NextRequest): Promise<boolean> {
  const cookie = request.headers.get("cookie");

  if (!cookie) {
    return false;
  }

  try {
    const response = await fetch(
      `${getMiddlewareApiUrl()}/api/auth/get-session`,
      {
        method: "GET",
        headers: { cookie },
        cache: "no-store",
      },
    );

    if (response.status === 401 || !response.ok) {
      return false;
    }

    const body: unknown = await response.json();

    return hasAuthenticatedSession(body);
  } catch {
    return false;
  }
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isAuthenticated = await fetchHasSession(request);
  const isProtected = pathname.startsWith(PROTECTED_PREFIX);
  const isAuthPage = AUTH_PATHS.has(pathname);
  const isRoot = pathname === "/";

  if (isRoot) {
    return redirectTo(request, isAuthenticated ? "/dashboard" : "/login");
  }

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isAuthenticated) {
    return redirectTo(request, "/dashboard");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/"],
};
