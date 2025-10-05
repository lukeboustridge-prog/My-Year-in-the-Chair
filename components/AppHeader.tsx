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
    <header className="w-full border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">My Year in the Chair</Link>
        <nav className="flex items-center gap-4">
          <Link href="/reports" className="underline">Reports</Link>
          <SignOutButton provider="jwt" onLogout={logout} />
        </nav>
      </div>
    </header>
  );
}