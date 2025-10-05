// middleware.ts — protects all pages by default
import { NextResponse, type NextRequest } from 'next/server'

// Cookie name used for session (keep in sync with lib/auth.ts)
const COOKIE = 'myyitc_session'

// Paths that remain public (sign-in/out + static assets)
const PUBLIC_PATHS = [
  '/auth',
  '/api/auth/login',
  '/api/auth/logout',
  '/favicon.ico',
  '/robots.txt',
  '/manifest.json',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/public')
  ) return NextResponse.next()

  // Allow explicitly public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // Basic check: must have session cookie
  const hasSession = req.cookies.has(COOKIE)
  if (!hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Apply to all routes
export const config = {
  matcher: [
    '/((?!_next/|static/|images/|public/|favicon.ico|robots.txt|manifest.json).*)',
  ],
}
