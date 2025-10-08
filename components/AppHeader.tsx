'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SignOutButton from "./SignOutButton";

function NavLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
  const base = "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors border shadow-sm";
  const activeCls = " bg-blue-600 text-white border-blue-600";
  const idleCls = " bg-white hover:bg-gray-50";
  const classes = base + (active ? activeCls : idleCls) + (className ? ` ${className}` : "");
  return (
    <Link href={href} className={classes}>
      {label}
    </Link>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  const showSignOut = pathname !== '/login';
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/visits', label: 'Visits' },
    { href: '/my-work', label: 'My Lodge Workings' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/reports', label: 'Reports' },
    { href: '/login', label: 'Sign in' },
  ];

  return (
    <header className="w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="font-semibold text-base sm:text-lg">My Year in the Chair</Link>
        <button
          type="button"
          onClick={toggleMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="app-header-menu"
        >
          <span className="sr-only">Toggle navigation</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <nav className="hidden items-center gap-2 sm:gap-3 lg:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
          {showSignOut && <SignOutButton />}
        </nav>
      </div>
      <div
        id="app-header-menu"
        className={`lg:hidden border-t border-slate-200 bg-white transition-[max-height] duration-200 ease-out ${
          menuOpen ? 'max-h-96' : 'max-h-0 overflow-hidden'
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                className="w-full justify-center"
              />
            ))}
            {showSignOut ? <SignOutButton className="w-full justify-center" /> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
