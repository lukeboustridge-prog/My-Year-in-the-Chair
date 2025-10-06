import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// lib/auth.ts
// Dev-friendly auth shims to satisfy imports. Safe no-ops for local/dev builds.

export type User = {
  id: string;
  email: string;
  name?: string;
};

type SessionPayload = { userId?: string; id?: string; email: string };

const SESSION_COOKIE = 'session';
const LEGACY_COOKIE = 'myyitc_session';

function decodeSessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  try {
    if (token.startsWith('dev.')) {
      const b64 = token.slice(4);
      const json = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
      return json?.id || json?.userId || null;
    }
  } catch {}

  // Legacy JWT sessions (NextAuth / custom API)
  try {
    const secret = process.env.JWT_SECRET;
    if (secret) {
      const decoded = jwt.verify(token, secret) as any;
      return decoded?.userId || decoded?.id || null;
    }
  } catch {}

  // Fallback: try plain base64 JSON
  try {
    const json = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    return json?.id || json?.userId || null;
  } catch {}

  return null;
}

function extractCookieFromHeader(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  const pattern = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  const match = pattern.exec(header);
  return match ? decodeURIComponent(match[1]) : null;
}

export function signSession(payload: SessionPayload): string {
  const id = payload.userId || payload.id || 'dev-user';
  const blob = Buffer.from(JSON.stringify({ id, email: payload.email })).toString('base64url');
  return `dev.${blob}`;
}

export function setSessionCookie(res: any, token: string) {
  try {
    if (res?.cookies?.set) {
      res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, path: '/', sameSite: 'lax' });
      res.cookies.set(LEGACY_COOKIE, token, { httpOnly: true, path: '/', sameSite: 'lax' });
    }
  } catch {}
}

export function clearSessionCookie(res: any) {
  try {
    if (res?.cookies?.set) {
      res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 0 });
      res.cookies.set(LEGACY_COOKIE, '', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 0 });
    }
  } catch {}
}

function readCookie(name: string, req?: Request): string | null {
  const fromHeader = req ? extractCookieFromHeader(req.headers?.get?.('cookie') ?? null, name) : null;
  if (fromHeader) return fromHeader;
  try {
    const c = cookies().get(name)?.value;
    if (c) return c;
  } catch {}
  return null;
}

// Minimal helper used by various API routes/pages
export function getUserId(req?: Request): string | null {
  const candidates = [readCookie(SESSION_COOKIE, req), readCookie(LEGACY_COOKIE, req)];
  for (const token of candidates) {
    const id = decodeSessionToken(token);
    if (id) return id;
  }
  return null;
}

// Convenience wrappers that some routes may import
export async function authenticate(email: string, _password: string): Promise<User | null> {
  if (!email) return null;
  return { id: 'dev-user', email };
}

export async function createSession(user: User): Promise<{ token: string }> {
  return { token: signSession({ id: user.id, email: user.email }) };
}

export async function clearSession(): Promise<void> {
  return;
}
