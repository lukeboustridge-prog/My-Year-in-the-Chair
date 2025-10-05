import "./globals.css";
import Link from "next/link";
import SignOutButton from "../components/SignOutButton";

export const metadata = {
  title: "My Year in the Chair",
  description: "Freemasons Master companion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");
      window.location.assign("/login");
    }
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <header className="w-full border-b">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold">My Year in the Chair</Link>
            <nav className="flex items-center gap-4">
              <Link href="/reports" className="underline">Reports</Link>
              {/* Use JWT logout by default; swap to provider="firebase" if you use Firebase */}
              <SignOutButton provider="jwt" onLogout={logout} />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}