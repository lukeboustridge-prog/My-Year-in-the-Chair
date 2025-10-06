// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [/^\/login$/, /^\/api\//, /^\/_next\//, /^\/favicon\./, /^\/assets\//, /^\/images\//, /^\/public\//];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((re) => re.test(pathname))) return NextResponse.next();

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
  matcher: ['/((?!_next/|favicon.|assets/|images/|public/|api/).*)'],
};