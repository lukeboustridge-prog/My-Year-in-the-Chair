"use client";
import { useState } from "react";
import Link from "next/link";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    setLoading(false);
    if (res.ok) window.location.href = "/dashboard";
    else alert("Invalid credentials");
  };
  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={submit} className="space-y-3">
        <label>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
      <div className="text-sm mt-4">
        <span>Don't have an account? </span>
        <Link className="link" href="/auth/register">Create one</Link>
      </div>
    </div>
  );
}
