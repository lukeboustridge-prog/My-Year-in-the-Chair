'use client';
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import SignOutButton from "./SignOutButton";

const NAV_GROUPS = [
  {
    title: "Dashboard",
    links: [
      { href: "/", label: "Home" },
      { href: "/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    title: "My Journey",
    links: [
      { href: "/visits", label: "Visits" },
      { href: "/my-work", label: "My Lodge Work" },
      { href: "/reports", label: "Reports" },
    ],
  },
  {
    title: "Account",
    links: [{ href: "/login", label: "Sign in" }],
  },
];

function NavLink({ href, label, onNavigate }: { href: string; label: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  const base =
    "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors border shadow-sm";
  const activeCls = " bg-blue-600 text-white border-blue-600";
  const idleCls = " bg-white hover:bg-gray-50";
  return (
    <Link href={href} className={base + (active ? activeCls : idleCls)} onClick={onNavigate}>
      {label}
    </Link>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  const showSignOut = pathname !== "/login";
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:gap-4">
        <Link href="/" className="font-semibold text-base sm:text-lg">
          My Year in the Chair
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
          <nav className="hidden items-center gap-2 md:flex">
            {NAV_GROUPS.flatMap((group) => group.links).map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
            {showSignOut && <SignOutButton />}
          </nav>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t bg-white/95 shadow-lg md:hidden">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.title}
                </div>
                <div className="space-y-2 pl-3">
                  {group.links.map((link) => (
                    <NavLink key={link.href} href={link.href} label={link.label} onNavigate={() => setMenuOpen(false)} />
                  ))}
                </div>
              </div>
            ))}
            {showSignOut && (
              <div className="pt-2">
                <SignOutButton />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
