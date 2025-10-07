'use client';
import React from "react";

export default function SignOutButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = React.useState(false);
  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(()=>{});
    } finally {
      try {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
      } catch {}
      setBusy(false);
      if (typeof window !== 'undefined') window.location.assign('/login');
    }
  };
  return (
    <button className={`navlink ${className}`} onClick={onClick} aria-busy={busy}>
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}