"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { useEffect } from "react";
import { login } from "./actions";

const initialState = { error: "" };

export function LoginForm() {
  const [state, formAction] = useFormState(login, initialState);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (state?.success) {
      // no-op; NextAuth will redirect. Keeping hook to silence unused state.
    }
  }, [state]);

  return (
    <form action={formAction} className="card" style={{ maxWidth: "420px", margin: "0 auto" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Welcome back</h1>
        <p style={{ color: "rgba(148, 163, 184, 0.8)", margin: 0 }}>
          Sign in with the credentials provided to you for your lodge year tracker.
        </p>
      </header>
      <div className="grid" style={{ gap: "1rem" }}>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        </label>
        {state?.error ? (
          <p style={{ color: "rgb(248, 113, 113)", margin: 0 }}>{state.error}</p>
        ) : null}
        <button className="primary" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p style={{ fontSize: "0.85rem", color: "rgba(148, 163, 184, 0.8)", margin: 0 }}>
          Need an account? Contact your administrator to be added to the system.
        </p>
        <p style={{ fontSize: "0.85rem", color: "rgba(148, 163, 184, 0.8)", margin: 0 }}>
          Having trouble? Email <Link href="mailto:support@example.com">support@example.com</Link>.
        </p>
      </div>
    </form>
  );
}
