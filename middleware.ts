import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  if (token) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  if (req.nextUrl.pathname !== "/login") {
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ["/((?!login|api/auth|_next|favicon.ico).*)"] };
