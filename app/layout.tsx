import './globals.css';
import React from 'react';

export const metadata = {
  title: 'My Year in the Chair',
  description: 'Freemasons NZ – Visits & Workings tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main style={{ maxWidth: 860, margin: '0 auto', padding: 16 }}>
          <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <a href="/">Home</a>
            <a href="/visits">Visits</a>
            <a href="/workings">Workings</a>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
