import type { Metadata } from "next";

import "./globals.css";
import AppHeader from "../components/AppHeader";

export const metadata: Metadata = {
  title: "My Year in the Chair",
  description: "Freemasons Master companion",
  manifest: "/manifest.webmanifest",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    title: "My Year in the Chair",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-500">
          © {new Date().getFullYear()} My Year in the Chair
        </footer>
      </body>
    </html>
  );
}