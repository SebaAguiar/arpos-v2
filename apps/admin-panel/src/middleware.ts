import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicPaths = ["/login", "/api/trpc"];

async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("arcom_token")?.value;

  if (!(await isValidToken(token))) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (token) {
      response.cookies.delete("arcom_token");
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
