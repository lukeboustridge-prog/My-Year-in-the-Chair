import React from "react";

/**
 * SignOutButton
 * Works with Firebase Auth OR a custom JWT/session backend.
 * Props:
 *  - provider: "firebase" | "jwt"
 *  - firebaseAuth?: ReturnType<typeof import("firebase/auth")["getAuth"]>
 *  - onLogout?: () => Promise<void> | void
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
        window.location.assign("/login");
      } else {
        await props.onLogout?.();
        window.location.assign("/login");
      }
    } catch (err) {
      console.error("Sign out failed:", err);
      alert("Couldn’t sign you out. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      className={props.className || "px-3 py-2 rounded-lg border"}
      aria-busy={busy}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}