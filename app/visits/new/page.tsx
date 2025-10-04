"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewVisit() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,16));
  const [lodgeName, setLodgeName] = useState("");
  const [lodgeNumber, setLodgeNumber] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, lodgeName, lodgeNumber, location, notes })
    });
    setLoading(false);
    if (res.ok) router.push("/visits");
    else alert("Could not save");
  }

  return (
    <div className="max-w-xl mx-auto card">
      <h1 className="text-xl font-semibold mb-4">Log a visit</h1>
      <form onSubmit={submit} className="space-y-3">
        <label>Date and time</label>
        <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} required />
        <label>Lodge name</label>
        <input value={lodgeName} onChange={e=>setLodgeName(e.target.value)} required />
        <label>Lodge number</label>
        <input value={lodgeNumber} onChange={e=>setLodgeNumber(e.target.value)} required />
        <label>Location</label>
        <input value={location} onChange={e=>setLocation(e.target.value)} />
        <label>Notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} />
        <button className="btn btn-primary">{loading ? "Saving..." : "Save visit"}</button>
      </form>
    </div>
  );
}
