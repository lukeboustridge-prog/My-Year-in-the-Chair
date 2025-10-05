'use client';
import React from "react";

/**
 * Client-only SignOutButton with app-consistent styling.
 * Works with JWT/session or Firebase (dynamic import).
 */
type Props =
  | { provider: "firebase"; firebaseAuth: any; className?: string }
  | { provider: "jwt"; onLogout: () => Promise<void> | void; className?: string };

export default function SignOutButton(props: Props) {
  const [busy, setBusy] = React.useState(false);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (props.provider === "firebase") {
        const { signOut } = await import("firebase/auth");
        await signOut(props.firebaseAuth);
      } else {
        await props.onLogout?.();
      }
    } catch (e) {
      console.error("Sign out failed:", e);
      alert("Couldn’t sign you out. Please try again.");
    } finally {
      setBusy(false);
      if (typeof window !== "undefined") window.location.assign("/login");
    }
  };

  return (
    <button
      onClick={onClick}
      className={
        props.className ||
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium bg-white hover:bg-gray-50 shadow-sm"
      }
      aria-busy={busy}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 opacity-70">
        <path d="M16 13v-2H7V8l-5 4 5 4v-3h9z"></path>
        <path d="M20 3h-8a2 2 0 0 0-2 2v4h2V5h8v14h-8v-4h-2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"></path>
      </svg>
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}