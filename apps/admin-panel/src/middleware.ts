import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicPaths = ["/login", "/api/trpc"];

// Origins allowed to call the admin API from a browser/WebView. Defaults to
// the POS dev server and the Tauri WebView origins so the license flow works
// out of the box. Override with the CORS_ALLOWED_ORIGINS env var (comma list).
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:1420",
  "http://127.0.0.1:1420",
  "tauri://localhost",
  "http://tauri.localhost",
  "http://localhost:4321",
];

const CORS_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_HEADERS = "Content-Type, Authorization";

function allowedOrigins(): string[] {
  const fromEnv = process.env.CORS_ALLOWED_ORIGINS;
  if (!fromEnv) return DEFAULT_ALLOWED_ORIGINS;
  return fromEnv
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins().includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": CORS_METHODS,
    "Access-Control-Allow-Headers": CORS_HEADERS,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

function withCors(base: NextResponse, request: NextRequest): NextResponse {
  const headers = corsHeaders(request);
  for (const [key, value] of Object.entries(headers)) {
    base.headers.set(key, value);
  }
  return base;
}

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
  const hasCors = Object.keys(corsHeaders(request)).length > 0;

  // Handle CORS preflight (browsers send OPTIONS before cross-origin JSON).
  if (request.method === "OPTIONS" && hasCors) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
  }

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return withCors(NextResponse.next(), request);
  }

  if (pathname.startsWith("/api/")) {
    return withCors(NextResponse.next(), request);
  }

  const token = request.cookies.get("arcom_token")?.value;

  if (!(await isValidToken(token))) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (token) {
      response.cookies.delete("arcom_token");
    }
    return withCors(response, request);
  }

  return withCors(NextResponse.next(), request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
