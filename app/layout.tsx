import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Year in the Chair",
  description: "Track visits, lodge workings, and milestones for your year in the chair.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
