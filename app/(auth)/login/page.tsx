import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div>
          <h1>Welcome back</h1>
          <p>Sign in to track your year in the chair.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
