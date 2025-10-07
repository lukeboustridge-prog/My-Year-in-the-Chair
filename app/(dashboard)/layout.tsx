import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

function Nav() {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1.5rem",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>My Year in the Chair</h1>
        <p style={{ margin: 0, color: "rgba(148, 163, 184, 0.8)", fontSize: "0.95rem" }}>
          Track visits, lodge workings, offices, and milestones during your year of service.
        </p>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button type="submit" className="danger">
          Sign out
        </button>
      </form>
    </header>
  );
}

function Tabs() {
  const items = [
    { href: "/", label: "Dashboard" },
    { href: "/visits", label: "Visits" },
    { href: "/workings", label: "Lodge Workings" },
  ];
  return (
    <nav style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="badge"
          style={{ textDecoration: "none" }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <Nav />
      <Tabs />
      {children}
    </div>
  );
}
