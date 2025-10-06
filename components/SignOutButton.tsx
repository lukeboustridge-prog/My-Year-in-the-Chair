'use client';
import React from "react";

export default function SignOutButton() {
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
      if (typeof window !== "undefined") window.location.assign("/login");
    }
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium border bg-white hover:bg-gray-50 shadow-sm"
      aria-busy={busy}
      title="Sign out"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}