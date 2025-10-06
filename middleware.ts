// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth guard:
 * - Allows public paths: /login, /api/*, /_next/*, /favicon.*, /assets/*, /public/*, /images/*
 * - For other paths, requires a cookie named one of: access_token, token, session
 *   (You can adjust names to fit your backend.)
 */
const PUBLIC_PATHS = [/^\/login$/, /^\/api\//, /^\/_next\//, /^\/favicon\./, /^\/assets\//, /^\/images\//, /^\/public\//];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // Check for auth cookies
  const hasCookie =
    req.cookies.has('access_token') ||
    req.cookies.has('token') ||
    req.cookies.has('session');

  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/|favicon.|assets/|images/|public/|api/).*)',
  ],
};