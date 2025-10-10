"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { REGIONS } from "@/lib/regions";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          region: region ? region : undefined,
        }),
      });

      if (!res.ok) {
        const msg = (await res.text())?.trim();
        throw new Error(msg || "Could not create account");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="h1">Create account</h1>
        <p className="subtle mt-1">Start tracking your visits with a new account.</p>
      </div>
      <div className="card">
        <form onSubmit={submit} className="card-body space-y-5">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="label">
              <span>Name (optional)</span>
              <input
                className="input mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
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
              <span>Region (optional)</span>
              <select
                className="input mt-1"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">Select a region</option>
                {REGIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              <span>Password</span>
              <input
                className="input mt-1"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </label>
            <label className="label sm:col-span-2">
              <span>Confirm password</span>
              <input
                className="input mt-1"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button className="btn-primary w-full sm:w-auto" disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </button>
            <Link href="/login" className="btn-soft w-full text-center sm:w-auto">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
