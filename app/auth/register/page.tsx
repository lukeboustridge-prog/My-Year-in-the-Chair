"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    setLoading(false);
    if (res.ok) {
      // go straight to dashboard after auto-login
      window.location.href = "/dashboard";
    } else {
      const msg = await res.text();
      alert(msg || "Could not create account");
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-xl font-semibold mb-4">Create account</h1>
      <form onSubmit={submit} className="space-y-3">
        <label>Name (optional)</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
        <label>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required />
        <label>Confirm password</label>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={6} required />
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
