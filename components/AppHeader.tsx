'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
  const base = "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors border shadow-sm";
  const activeCls = " bg-blue-600 text-white border-blue-600";
  const idleCls = " bg-white hover:bg-gray-50";
  return (
    <Link href={href} className={base + (active ? activeCls : idleCls)}>
      {label}
    </Link>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  const showSignOut = pathname !== '/login';

  return (
    <header className="w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-6">
        <Link href="/" className="font-semibold text-base sm:text-lg">My Year in the Chair</Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <NavLink href="/" label="Home" />
          <NavLink href="/visits" label="Visits" />
          <NavLink href="/my-work" label="My Lodge Workings" />
          <NavLink href="/leaderboard" label="Leaderboard" />
          <NavLink href="/reports" label="Reports" />
          <NavLink href="/login" label="Sign in" />
          {showSignOut && <SignOutButton />}
        </nav>
      </div>
    </header>
  );
}