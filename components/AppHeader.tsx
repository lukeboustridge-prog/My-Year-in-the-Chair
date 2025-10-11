'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { CurrentUser } from "@/lib/currentUser";

import SignOutButton from "./SignOutButton";

type NavItem = {
  href: string;
  label: string;
  requiresAuth?: boolean;
  requiresApproval?: boolean;
  requiresAdmin?: boolean;
  requiresDistrictApprover?: boolean;
  hideWhenAuthed?: boolean;
};

function NavLink({ href, label, className }: { href: string; label: string; className?: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
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

export type AppHeaderProps = {
  user: CurrentUser | null;
};

export default function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthed = Boolean(user);
  const isApproved = Boolean(user?.isApproved);
  const isAdmin = user?.role === "ADMIN";
  const isDistrictApprover = user?.role === "DISTRICT";
  const isApprover = isAdmin || isDistrictApprover;
  const onLoginPage = pathname === "/login";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navLinks = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { href: "/", label: "Home", requiresAuth: true },
      { href: "/visits", label: "Visits", requiresAuth: true },
      { href: "/my-work", label: "My Lodge Workings", requiresAuth: true },
      { href: "/my-freemasonry", label: "My Freemasonry", requiresAuth: true },
      {
        href: "/leaderboard",
        label: "Leaderboard",
        requiresAuth: true,
        requiresApproval: true,
      },
      { href: "/reports", label: "Reports", requiresAuth: true },
    ];

    if (isAdmin) {
      items.push({
        href: "/admin/users",
        label: "Admin",
        requiresAuth: true,
        requiresAdmin: true,
      });
    } else if (isDistrictApprover) {
      items.push({
        href: "/admin/users",
        label: "Approvals",
        requiresAuth: true,
        requiresDistrictApprover: true,
      });
    }

    items.push({ href: "/login", label: "Sign in", hideWhenAuthed: true });
    return items;
  }, [isAdmin, isDistrictApprover]);

  const visibleLinks = navLinks.filter((link) => {
    if (link.requiresAdmin && !isAdmin) return false;
    if (link.requiresDistrictApprover && !isDistrictApprover) return false;
    if (link.requiresApproval && !isApproved && !isApprover) return false;
    if (link.requiresAuth && !isAuthed) return false;
    if (link.hideWhenAuthed && isAuthed) return false;
    if (!link.requiresAuth && !link.hideWhenAuthed) return true;
    if (link.requiresAuth && isAuthed) return true;
    return !link.requiresAuth && !isAuthed;
  });

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold sm:text-lg">
          <img
            src="https://freemasonsnz.org/wp-content/uploads/2024/05/TransparentBlueCompass.png"
            alt="Freemasons New Zealand"
            className="h-8 w-8 shrink-0 rounded"
            loading="lazy"
          />
          <span className="text-slate-900">My Year in the Chair</span>
        </Link>
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
          {visibleLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
          {isAuthed && !onLoginPage ? <SignOutButton /> : null}
        </nav>
      </div>
      <div
        id="app-header-menu"
        className={`lg:hidden border-t border-slate-200 bg-white transition-[max-height] duration-200 ease-out ${
          menuOpen ? "max-h-96" : "max-h-0 overflow-hidden"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-col gap-2">
            {visibleLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} className="w-full justify-center" />
            ))}
            {isAuthed && !onLoginPage ? <SignOutButton className="w-full justify-center" /> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
