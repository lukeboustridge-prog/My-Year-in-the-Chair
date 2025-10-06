// lib/auth.ts
// Minimal auth helpers to satisfy imports during build.
// Replace with your real implementation when wiring a proper auth backend.

export type User = {
  id: string;
  email: string;
  name?: string;
};

export async function authenticate(email: string, _password: string): Promise<User | null> {
  // DEV-ONLY stub: accept any email, ignore password
  if (!email) return null;
  return { id: 'dev-user', email };
}

export async function createSession(_user: User): Promise<{ token: string }> {
  // DEV-ONLY stub issue a fake token
  return { token: 'dev-session-token' };
}

export async function getUserFromRequest(_req: Request): Promise<User | null> {
  // DEV-ONLY: unauthenticated by default
  return null;
}

export async function clearSession(): Promise<void> {
  return;
}

// Optional helpers if your routes import them
export async function hashPassword(pw: string): Promise<string> {
  return 'hashed:' + pw;
}

export async function comparePassword(pw: string, hashed: string): Promise<boolean> {
  return hashed === 'hashed:' + pw;
}
