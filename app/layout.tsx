import "./globals.css";
import Header from "../components/Header";

const BRAND_ICON_URL = "https://freemasonsnz.org/wp-content/uploads/2024/05/TransparentBlueCompass.png";

export const metadata = {
  title: "My Year in the Chair",
  description: "Freemasons Master companion",
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
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-500">
          © {new Date().getFullYear()} My Year in the Chair
        </footer>
      </body>
    </html>
  );
}