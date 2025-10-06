'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import SignOutButton from "./SignOutButton";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
  return (
    <Link href={href} className={`navlink ${active ? 'navlink-active' : ''}`}>
      {label}
    </Link>
  );
}

function useAuthed() {
  const [authed, setAuthed] = React.useState(false);
  React.useEffect(() => {
    try {
      const hasLS = !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
      const cookieMatch = document.cookie.match(/(?:^|;\s*)(access_token|token|session)=/);
      setAuthed(Boolean(hasLS || cookieMatch));
    } catch {
      setAuthed(false);
    }
  }, []);
  return authed;
}

export default function Header() {
  const authed = useAuthed();
  const pathname = usePathname();
  const hideSignOut = pathname === '/login';

  return (
    <header className="sticky-header">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-6">
        <Link href="/" className="font-semibold text-base sm:text-lg">My Year in the Chair</Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          {/* Removed Home. Added explicit Dashboard */}
          <NavLink href="/" label="Dashboard" />
          <NavLink href="/visits" label="Visits" />
          <NavLink href="/my-work" label="My Lodge Workings" />
          <NavLink href="/leaderboard" label="Leaderboard" />
          <NavLink href="/reports" label="Reports" />
          {!authed && <NavLink href="/login" label="Sign in" />}
          {authed && !hideSignOut && <SignOutButton />}
        </nav>
      </div>
    </header>
  );
}