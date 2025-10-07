'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import SignOutButton from "./SignOutButton";

type NavItem = { href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/visits", label: "Visits" },
  { href: "/my-work", label: "My Lodge Workings" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/reports", label: "Reports" },
];

function NavLink({ href, label, onNavigate }: { href: string; label: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`navlink w-full justify-start md:w-auto md:justify-center ${active ? 'navlink-active' : ''}`}
    >
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
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky-header border-b border-slate-200 bg-white/95">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-3 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="https://freemasonsnz.org/wp-content/uploads/2019/05/freemason_colour_standardonwhite.png"
            alt="Freemasons New Zealand"
            className="h-10 w-auto"
            loading="lazy"
          />
          <span className="text-base font-semibold text-slate-900 sm:text-lg">My Year in the Chair</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="navlink h-10 w-10 p-0 text-sm md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
        >
          <span className="sr-only">Toggle navigation</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <nav className="hidden items-center gap-2 md:flex md:gap-2.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
          {!authed && <NavLink href="/login" label="Sign in" />}
          {authed && !hideSignOut && (
            <SignOutButton className="w-full justify-start md:w-auto md:justify-center" />
          )}
        </nav>
      </div>
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-3 py-3 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} onNavigate={() => setMobileOpen(false)} />
            ))}
            {!authed && (
              <NavLink href="/login" label="Sign in" onNavigate={() => setMobileOpen(false)} />
            )}
            {authed && !hideSignOut && (
              <SignOutButton className="w-full justify-start" />
            )}
          </nav>
        </div>
      )}
    </header>
  );
}