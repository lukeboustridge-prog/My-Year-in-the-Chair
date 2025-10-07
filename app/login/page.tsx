'use client';
export const dynamic = 'force-dynamic';
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function getRedirect(): string {
  if (typeof window === 'undefined') return '/';
  try {
    const sp = new URLSearchParams(window.location.search);
    return sp.get('redirect') || '/';
  } catch {
    return '/';
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => {
    try {
      const hasLS = !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
      const cookieMatch = document.cookie.match(/(?:^|;\s*)(access_token|token|session)=/);
      if (hasLS || cookieMatch) router.replace(getRedirect());
    } catch {}
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error((await res.text()) || 'Login failed');
      try {
        const data = await res.json().catch(() => null);
        if (data?.token) {
          localStorage.setItem('access_token', data.token);
          sessionStorage.setItem('access_token', data.token);
        }
      } catch {}
      router.push(getRedirect()); router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(()=>{});
    } finally {
      try {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
      } catch {}
      setSigningOut(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="h1">Sign in</h1>
        <div className="flex items-center gap-3">
          <Link href="/auth/register" className="btn-soft">Create account</Link>
          <button className="navlink" onClick={onSignOut} disabled={signingOut}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
      <div className="card">
        <form className="card-body space-y-5" onSubmit={onSubmit}>
          {error && <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="label">
              <span>Email</span>
              <input className="input mt-1" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.org" />
            </label>
            <label className="label">
              <span>Password</span>
              <input className="input mt-1" type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" />
            </label>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}