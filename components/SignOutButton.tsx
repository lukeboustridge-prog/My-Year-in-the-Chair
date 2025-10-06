'use client';
import React from "react";

/**
 * Styled SignOutButton that works for cookie or token auth.
 * If you use Firebase, swap the internals accordingly.
 */
export default function SignOutButton({ onLoggedOut }: { onLoggedOut?: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    } finally {
      try {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
      } catch {}
      setBusy(false);
      onLoggedOut?.();
    }
  };
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium border bg-white hover:bg-gray-50 shadow-sm"
      aria-busy={busy}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}