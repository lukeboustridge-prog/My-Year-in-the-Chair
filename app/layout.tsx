import "./globals.css";
import Header from "../components/Header";

export const metadata = {
  title: "My Year in the Chair",
  description: "Freemasons Master companion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
