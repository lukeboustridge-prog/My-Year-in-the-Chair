'use client';
import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default function AppHeader() {
  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");
      window.location.assign("/login");
    }
  }

  return (
    <header className="w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">My Year in the Chair</Link>
        <nav className="flex items-center gap-3">
          <Link href="/reports" className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium border bg-white hover:bg-gray-50 shadow-sm">
            Reports
          </Link>
          <SignOutButton provider="jwt" onLogout={logout} />
        </nav>
      </div>
    </header>
  );
}