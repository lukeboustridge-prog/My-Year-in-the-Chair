import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "My Year in the Chair",
  description: "Track visits, lodge workings, and your progress as Master.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner container">
            <div className="brand">
              <img src="/logo.svg" alt="Logo" />
              <span>My Year in the Chair</span>
            </div>
            <div className="menu">
              <Link href="/">Dashboard</Link>
              <Link href="/visits">Visits</Link>
              <Link href="/my-work">My Lodge Workings</Link>
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/resources">Resources</Link>
              <Link href="/profile">Profile</Link>
              <Link href="/auth">Sign in</Link>
            </div>
          </div>
        </nav>
        <main className="main container">{children}</main>
      </body>
    </html>
  );
}
