import { NextResponse } from "next/server";
import { verifySessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Always allow auth API routes, device image endpoints, and the public HR IRIS dashboard
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/hr/ping/iris") ||
    pathname === "/api/devices/image" ||
    (pathname.startsWith("/api/devices/") && pathname.endsWith("/image"))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  const isAuthenticated = Boolean(session && session.username);

  // If visiting /login:
  if (pathname === "/login") {
    if (isAuthenticated) {
      const from = request.nextUrl.searchParams.get("from");
      const redirectUrl = from && from.startsWith("/") && from !== "/login" ? from : "/";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.next();
  }

  // If not authenticated and visiting any other route:
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname && pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

