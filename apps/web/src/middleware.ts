import { type NextRequest, NextResponse } from "next/server";

import { isProtectedDashboardPath } from "@/modules/dashboard/data/protected-routes";

const DEFAULT_API_URL = "http://localhost:3333";

const AUTH_PATHS = new Set(["/login", "/signup"]);

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

type SessionStatus = "none" | "no-org" | "active";

async function fetchSessionStatus(request: NextRequest): Promise<SessionStatus> {
  const cookie = request.headers.get("cookie");

  if (!cookie) {
    return "none";
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
      return "none";
    }

    const body: unknown = await response.json();

    if (!isRecord(body)) return "none";

    const session = body.session;
    const user = body.user;

    if (!isRecord(session) || !isRecord(user)) return "none";
    if (typeof user.id !== "string" || typeof session.id !== "string") return "none";

    return typeof session.activeOrganizationId === "string" &&
      session.activeOrganizationId.length > 0
      ? "active"
      : "no-org";
  } catch {
    return "none";
  }
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const status = await fetchSessionStatus(request);
  const isProtected = isProtectedDashboardPath(pathname);
  const isAuthPage = AUTH_PATHS.has(pathname);
  const isSetup = pathname === "/setup";
  const isRoot = pathname === "/";

  if (isRoot) {
    // Authenticated users skip the marketing landing and go straight to the app.
    if (status === "active") return redirectTo(request, "/dashboard");
    if (status === "no-org") return redirectTo(request, "/setup");
    // Unauthenticated visitors see the public landing page.
    return NextResponse.next();
  }

  if (status === "none") {
    if (isProtected || isSetup) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Authenticated (with or without org)
  if (isAuthPage) {
    return redirectTo(request, status === "active" ? "/dashboard" : "/setup");
  }

  if (status === "active") {
    if (isSetup) return redirectTo(request, "/dashboard");
    return NextResponse.next();
  }

  // Authenticated but no org — must go to setup
  if (!isSetup) {
    return redirectTo(request, "/setup");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/properties/:path*",
    "/leads/:path*",
    "/visits/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/setup",
    "/",
  ],
};
