import React from "react";

/**
 * SignOutButton
 * Works with either Firebase auth or a custom JWT/session backend.
 *
 * Usage (JWT/API example):
 *   <SignOutButton provider="jwt" onLogout={async () => {
 *     await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
 *     localStorage.removeItem('access_token');
 *     sessionStorage.removeItem('access_token');
 *   }}/>
 *
 * Usage (Firebase example):
 *   import { getAuth } from 'firebase/auth';
 *   const auth = getAuth();
 *   <SignOutButton provider="firebase" firebaseAuth={auth} />
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
      className={props.className || "px-3 py-2 rounded-md border"}
      aria-busy={busy}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}