import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "My Year in the Chair",
  description: "Track visits, lodge workings, and your progress as Master.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang=\"en\">
      <body className=\"bg-gray-900 text-gray-100\">
        <nav className=\"flex justify-between items-center px-6 py-4 bg-gray-800 shadow\">
          <div className=\"text-lg font-semibold\">My Year in the Chair</div>
          <div className=\"space-x-4 text-sm\">
            <Link href=\"/\">Dashboard</Link>
            <Link href=\"/visits\">Visits</Link>
            <Link href=\"/my-work\">My Lodge Workings</Link>
            <Link href=\"/leaderboard\">Leaderboard</Link>
            <Link href=\"/resources\">Resources</Link>
            <Link href=\"/profile\">Profile</Link>
            <Link href=\"/auth\">Sign in</Link>
          </div>
        </nav>
        <main className=\"p-6\">{children}</main>
      </body>
    </html>
  );
}
