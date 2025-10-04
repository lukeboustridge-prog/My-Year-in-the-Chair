import "./globals.css";
import Link from "next/link";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "My Year in the Chair",
  description: "Assist a Master to track visits and compete on a leaderboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  return (
    <html lang="en">
      <body>
        <header className="border-b border-gray-200 dark:border-gray-800">
          <div className="container flex items-center justify-between py-3">
            <Link href="/" className="font-semibold text-lg">My Year in the Chair</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="link">Dashboard</Link>
              <Link href="/visits" className="link">Visits</Link>
              <Link href="/leaderboard" className="link">Leaderboard</Link>
              <Link href="/resources" className="link">Resources</Link>
              {!session ? (
                <Link href="/auth" className="btn btn-primary">Sign in</Link>
              ) : (
                <form action="/api/auth/logout" method="post"><button className="btn">Sign out</button></form>
              )}
            </nav>
          </div>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="container py-8 text-sm text-gray-500">© {new Date().getFullYear()} My Year in the Chair</footer>
      </body>
    </html>
  );
}
