// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Public paths: login, api, assets */
const PUBLIC = [/^\/login$/, /^\/api\//, /^\/_next\//, /^\/favicon\./, /^\/assets\//, /^\/images\//, /^\/public\//];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some(re => re.test(pathname))) return NextResponse.next();

  const authed =
    req.cookies.has('access_token') ||
    req.cookies.has('token') ||
    req.cookies.has('session');

  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/|favicon.|assets/|images/|public/|api/).*)'] };