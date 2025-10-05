'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
  const base =
    "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium border shadow-sm";
  const activeCls = " bg-blue-600 text-white border-blue-600";
  const idleCls = " bg-white hover:bg-gray-50";
  return (
    <Link href={href} className={base + (active ? activeCls : idleCls)}>
      {children}
    </Link>
  );
}

export default function AppHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold truncate">My Year in the Chair</Link>
        <button
          className="sm:hidden inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium border bg-white hover:bg-gray-50 shadow-sm"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-controls="app-nav"
        >
          Menu
        </button>
        <nav id="app-nav" className={"hidden sm:flex items-center gap-3 " + (open ? "sm:flex" : "")}>
          <NavLink href="/">Home</NavLink>
          <NavLink href="/visits">Visits</NavLink>
          <NavLink href="/my-work">My Lodge Workings</NavLink>
          <NavLink href="/leaderboard">Leaderboard</NavLink>
          <NavLink href="/reports">Reports</NavLink>
          <NavLink href="/login">Sign in</NavLink>
        </nav>
      </div>
      {open && (
        <div className="sm:hidden border-t">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/visits">Visits</NavLink>
            <NavLink href="/my-work">My Lodge Workings</NavLink>
            <NavLink href="/leaderboard">Leaderboard</NavLink>
            <NavLink href="/reports">Reports</NavLink>
            <NavLink href="/login">Sign in</NavLink>
          </div>
        </div>
      )}
    </header>
  );
}