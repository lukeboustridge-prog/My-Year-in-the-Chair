import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "My Year in the Chair",
  description: "Freemasons Master toolkit",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur">
          <nav className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link className="font-semibold mr-2" href="/">My Year in the Chair</Link>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <Link href="/visits" className="hover:underline">Visits</Link>
              <Link href="/visits/new" className="hover:underline">New Visit</Link>
              <Link href="/my-work" className="hover:underline">My Work</Link>
              <Link href="/workings" className="hover:underline">My Lodge Workings</Link>
              <Link href="/leaderboard/year" className="hover:underline">Leaderboard (Year)</Link>
              <Link href="/leaderboard/month" className="hover:underline">Leaderboard (Month)</Link>
              <Link href="/resources" className="hover:underline">Resources</Link>
              <Link href="/reports" className="hover:underline">Reports</Link>
              <Link href="/profile" className="hover:underline">Profile</Link>
              <Link href="/auth" className="hover:underline ml-auto">Sign in</Link>
            </div>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
