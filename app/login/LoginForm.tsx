"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function getRedirect(): string {
  if (typeof window === "undefined") return "/";
  try {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("redirect") || "/";
  } catch {
    return "/";
  }
}

interface LoginFormProps {
  googleEnabled: boolean;
}

export default function LoginForm({ googleEnabled }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [signingOut, setSigningOut] = React.useState(false);
  const [oauthBusy, setOauthBusy] = React.useState(false);

  React.useEffect(() => {
    try {
      const hasLS = !!(localStorage.getItem("access_token") || sessionStorage.getItem("access_token"));
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Login failed");
      try {
        const data = await res.json().catch(() => null);
        if (data?.token) {
          localStorage.setItem("access_token", data.token);
          sessionStorage.setItem("access_token", data.token);
        }
      } catch {}
      router.push(getRedirect());
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    } finally {
      try {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
      } catch {}
      setSigningOut(false);
    }
  }

  const startGoogle = React.useCallback(() => {
    if (!googleEnabled || oauthBusy) return;
    setOauthBusy(true);
    try {
      const redirect = getRedirect();
      const target = `/api/auth/google?redirect=${encodeURIComponent(redirect)}`;
      window.location.href = target;
    } catch {
      window.location.href = `/api/auth/google`;
    }
  }, [googleEnabled, oauthBusy]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="h1">Sign in</h1>
        <button className="navlink w-full text-center sm:w-auto" onClick={onSignOut} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
      <div className="card">
        <div className="card-body space-y-5">
          {googleEnabled ? (
            <div className="space-y-3">
              <button
                type="button"
                className="btn-soft w-full flex items-center justify-center gap-2"
                onClick={startGoogle}
                disabled={oauthBusy}
              >
                {oauthBusy ? "Connecting to Google…" : "Sign in with Google"}
              </button>
              <div className="relative text-center">
                <span className="bg-white px-2 text-sm text-slate-500">or sign in with email</span>
                <div className="absolute inset-x-0 top-1/2 -z-10 h-px -translate-y-1/2 bg-slate-200" aria-hidden />
              </div>
            </div>
          ) : null}
          <form className="space-y-5" onSubmit={onSubmit}>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="label">
                <span>Email</span>
                <input
                  className="input mt-1"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.org"
                />
              </label>
              <label className="label">
                <span>Password</span>
                <input
                  className="input mt-1"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button className="btn-primary w-full sm:w-auto" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
              <Link href="/auth/register" className="btn-soft w-full text-center sm:w-auto">
                Create account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
