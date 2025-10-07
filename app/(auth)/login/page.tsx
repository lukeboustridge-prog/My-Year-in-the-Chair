import { redirect } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in | My Year in the Chair",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
      <LoginForm />
    </div>
  );
}
