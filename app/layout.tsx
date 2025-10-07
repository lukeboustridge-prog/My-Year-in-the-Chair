import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Year in the Chair",
  description: "Track visits, lodge workings, and milestones from your year in the chair.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          background: "radial-gradient(circle at top, rgba(30, 64, 175, 0.25), rgba(2, 6, 23, 0.95))",
          color: "#e2e8f0",
          margin: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: "1040px",
            display: "flex",
            flexDirection: "column",
            gap: "2.5rem",
            padding: "3rem 1.5rem 4rem",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
