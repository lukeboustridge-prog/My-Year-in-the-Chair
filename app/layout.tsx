import "./globals.css";
import AppHeader from "../components/AppHeader";

export const metadata = {
  title: "My Year in the Chair",
  description: "Freemasons Master companion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}