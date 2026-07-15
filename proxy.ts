import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth/session";

const PUBLIC_ROUTES = new Set(["/login", "/setup"]);

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await hasValidSession(req);

  if (pathname === "/") {
    return NextResponse.redirect(new URL(authed ? "/dashboard" : "/login", req.url));
  }

  const isPublic = PUBLIC_ROUTES.has(pathname) || pathname.startsWith("/accept-invite/");

  if (!isPublic && !authed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/login" && authed) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
