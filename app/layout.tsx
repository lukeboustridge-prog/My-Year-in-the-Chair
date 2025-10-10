import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import dynamic from "next/dynamic";

const AddToHomeScreenPrompt = dynamic(
  () => import("../components/AddToHomeScreenPrompt"),
  { ssr: false }
);

const BRAND_ICON_URL = "https://freemasonsnz.org/wp-content/uploads/2024/05/TransparentBlueCompass.png";
const THEME_COLOR = "#00529B";

export const metadata: Metadata = {
  title: "My Year in the Chair",
  description: "Freemasons Master companion",
  applicationName: "My Year in the Chair",
  themeColor: THEME_COLOR,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My Year in the Chair",
  },
  icons: {
    icon: BRAND_ICON_URL,
    shortcut: BRAND_ICON_URL,
    apple: BRAND_ICON_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href={BRAND_ICON_URL} />
        <link rel="apple-touch-icon" href={BRAND_ICON_URL} />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content={THEME_COLOR} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-500">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} My Year in the Chair</span>
            <nav className="flex flex-wrap gap-4">
              <a className="hover:text-slate-700" href="/privacy">
                Privacy Policy
              </a>
              <a className="hover:text-slate-700" href="/terms">
                Terms of Service
              </a>
            </nav>
          </div>
        </footer>
        <AddToHomeScreenPrompt />
      </body>
    </html>
  );
}