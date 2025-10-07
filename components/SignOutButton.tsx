'use client';
import React from "react";

type SignOutButtonProps = {
  className?: string;
};

export default function SignOutButton({ className }: SignOutButtonProps = {}) {
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
  const classes = ['navlink', className].filter(Boolean).join(' ');
  return (
    <button className={classes} onClick={onClick} aria-busy={busy}>
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}