"use client";
import { useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");
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
      <p className="text-sm mt-4">Demo login is pre-filled. Change after seeding.</p>
    </div>
  );
}
