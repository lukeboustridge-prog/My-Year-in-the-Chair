'use client';
export const dynamic = 'force-dynamic';
import React from "react";
import { useRouter } from "next/navigation";

function getRedirectFromLocation(): string {
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

  // If already authed, bounce to redirect or home
  React.useEffect(() => {
    try {
      const hasLS = typeof window !== 'undefined' && (localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
      const hasCookie = typeof document !== 'undefined' && /(?:^|; )(?:access_token|token|session)=/.test(document.cookie);
      if (hasLS || hasCookie) {
        router.replace(getRedirectFromLocation());
      }
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
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Login failed');
      }
      // Optional token support
      try {
        const data = await res.json().catch(() => null);
        if (data?.token) {
          localStorage.setItem('access_token', data.token);
          sessionStorage.setItem('access_token', data.token);
        }
      } catch {}
      router.push(getRedirectFromLocation());
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <span className="text-sm text-gray-500">Welcome back</span>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm">
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.org"
                autoComplete="email"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>

      <p className="text-sm text-gray-600">
        Tip: Use the same credentials you registered with. If you’ve forgotten them, contact your administrator.
      </p>
    </div>
  );
}