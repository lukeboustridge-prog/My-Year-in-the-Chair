"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const WORKS = ["INITIATION","PASSING","RAISING","INSTALLATION","PRESENTATION","LECTURE","OTHER"] as const;

export default function NewVisitPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [lodgeName, setLodgeName] = useState("");
  const [lodgeNumber, setLodgeNumber] = useState("");
  const [region, setRegion] = useState("");
  const [workOfEvening, setWork] = useState<typeof WORKS[number]>("OTHER");
  const [candidateName, setCandidate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        lodgeName,
        lodgeNumber,
        region: region || undefined,
        workOfEvening,
        candidateName: candidateName || undefined,
        location: location || undefined,
        notes: notes || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) router.push("/visits");
    else alert(await res.text());
  }

  return (
    <div className="max-w-xl mx-auto card">
      <h1 className="text-xl font-semibold mb-4">Log a visit</h1>
      <form onSubmit={submit} className="grid gap-3">
        <label>Date</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} required />

        <label>Lodge name</label>
        <input value={lodgeName} onChange={e=>setLodgeName(e.target.value)} required />

        <label>Lodge number</label>
        <input value={lodgeNumber} onChange={e=>setLodgeNumber(e.target.value)} required />

        <label>Region</label>
        <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="e.g. Waikato" />

        <label>Work of the evening</label>
        <select value={workOfEvening} onChange={e=>setWork(e.target.value as any)}>
          {WORKS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>

        <label>Candidate name</label>
        <input value={candidateName} onChange={e=>setCandidate(e.target.value)} placeholder="If applicable" />

        <label>Location</label>
        <input value={location} onChange={e=>setLocation(e.target.value)} />

        <label>Notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} />

        <button className="btn btn-primary mt-2" disabled={loading}>{loading ? "Saving..." : "Save visit"}</button>
      </form>
    </div>
  );
}
