import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/visits", label: "Visits" },
  { href: "/workings", label: "Lodge Workings" },
];

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand">My Year in the Chair</div>
          <nav className="nav-links">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <span>
              Welcome back, {session.user?.name ?? session.user?.email ?? "your account"}
            </span>
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}>
              <button type="submit" className="button secondary">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
