import { NextResponse, type NextRequest } from "next/server";

const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/admin/login",
  "/api/license/validate",
  "/api/license/status",
  "/api/license/activate",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/license/") || pathname.startsWith("/api/sync/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
