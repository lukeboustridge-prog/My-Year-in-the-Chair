'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import SignOutButton from "./SignOutButton";

type NavLinkProps = {
  href: string;
  label: string;
  className?: string;
};

function NavLink({ href, label, className }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
  const classes = ['navlink', active ? 'navlink-active' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <Link href={href} className={classes}>
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
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/visits', label: 'Visits' },
    { href: '/my-work', label: 'My Lodge Workings' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/reports', label: 'Reports' },
  ];

  return (
    <header className="sticky-header">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-semibold text-base sm:text-lg">My Year in the Chair</Link>
          <nav className="hidden sm:flex items-center gap-2 sm:gap-3">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
            {!authed && <NavLink href="/login" label="Sign in" />}
            {authed && !hideSignOut && <SignOutButton />}
          </nav>
          <button
            type="button"
            className="navlink sm:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
        {menuOpen && (
          <nav className="mt-3 grid gap-2 sm:hidden">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                className="w-full justify-start"
              />
            ))}
            {!authed && (
              <NavLink href="/login" label="Sign in" className="w-full justify-start" />
            )}
            {authed && !hideSignOut && (
              <SignOutButton className="w-full justify-start" />
            )}
          </nav>
        )}
      </div>
    </header>
  );
}