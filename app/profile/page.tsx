"use client";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [lodgeName, setLodgeName] = useState("");
  const [lodgeNumber, setLodgeNumber] = useState("");
  const [region, setRegion] = useState("");
  const [termStart, setTermStart] = useState("");
  const [termEnd, setTermEnd] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const u = await res.json();
        setName(u.name || "");
        setEmail(u.email || "");
        setLodgeName(u.lodgeName || "");
        setLodgeNumber(u.lodgeNumber || "");
        setRegion(u.region || "");
        setTermStart(u.termStart ? u.termStart.slice(0,10) : "");
        setTermEnd(u.termEnd ? u.termEnd.slice(0,10) : "");
      } else {
        alert("Please sign in to view your profile.");
      }
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || undefined,
        lodgeName: lodgeName || undefined,
        lodgeNumber: lodgeNumber || undefined,
        region: region || undefined,
        termStart: termStart || undefined,
        termEnd: termEnd || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) alert("Saved");
    else alert(await res.text());
  }

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <form onSubmit={save} className="card grid gap-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label>Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. WBro John Smith" />
          </div>
          <div>
            <label>Email</label>
            <input value={email} disabled className="opacity-70 cursor-not-allowed" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label>Lodge name</label>
            <input value={lodgeName} onChange={e=>setLodgeName(e.target.value)} placeholder="Waikato Lodge" />
          </div>
          <div>
            <label>Lodge number</label>
            <input value={lodgeNumber} onChange={e=>setLodgeNumber(e.target.value)} placeholder="No. 123" />
          </div>
          <div>
            <label>Region</label>
            <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="Waikato" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label>Term start</label>
            <input type="date" value={termStart} onChange={e=>setTermStart(e.target.value)} />
          </div>
          <div>
            <label>Term end</label>
            <input type="date" value={termEnd} onChange={e=>setTermEnd(e.target.value)} />
          </div>
        </div>

        <button className="btn btn-primary mt-2" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
