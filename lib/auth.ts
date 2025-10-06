// lib/auth.ts
// Dev-friendly auth shims to satisfy imports. Safe no-ops for local/dev builds.

export type User = {
  id: string;
  email: string;
  name?: string;
};

// Sign a simple opaque session string (NOT secure for production)
export function signSession(payload: { id: string; email: string }): string {
  const blob = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `dev.${blob}`;
}

// Attach a cookie named 'session'
export function setSessionCookie(res: any, token: string) {
  try {
    if (res?.cookies?.set) {
      res.cookies.set('session', token, { httpOnly: true, path: '/', sameSite: 'lax' });
    }
  } catch {}
}

// Clear the cookie
export function clearSessionCookie(res: any) {
  try {
    if (res?.cookies?.set) {
      res.cookies.set('session', '', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 0 });
    }
  } catch {}
}

// Minimal helper used by various API routes/pages
export async function getUserId(req?: Request): Promise<string | null> {
  try {
    // Try read the cookie from a standard Request
    const cookie = (req as any)?.headers?.get?.('cookie') || '';
    const m = /(?:^|;\s*)session=([^;]+)/.exec(cookie);
    if (m) {
      const token = decodeURIComponent(m[1]);
      if (token.startsWith('dev.')) {
        const b64 = token.slice(4);
        const json = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
        return json?.id || 'dev-user';
      }
      return 'dev-user';
    }
  } catch {}
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
