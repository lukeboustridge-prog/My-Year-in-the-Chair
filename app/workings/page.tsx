"use client";
import { useEffect, useState } from "react";

const WORKS = ["INITIATION","PASSING","RAISING","INSTALLATION","PRESENTATION","LECTURE","OTHER"] as const;

type Item = {
  id: string;
  month: number;
  year: number;
  work: typeof WORKS[number];
  candidateName?: string | null;
  notes?: string | null;
};

export default function WorkingsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [month, setMonth] = useState<number>(new Date().getMonth()+1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [work, setWork] = useState<typeof WORKS[number]>("OTHER");
  const [candidateName, setCandidate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const monthInputValue = `${year}-${String(month).padStart(2, "0")}`;

  async function load() {
    const res = await fetch("/api/workings", { credentials: "include" });
    if (res.ok) setItems(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/workings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ month, year, work, candidateName: candidateName || undefined, notes: notes || undefined })
    });
    setLoading(false);
    if (res.ok) {
      setCandidate(""); setNotes("");
      await load();
    } else {
      alert(await res.text());
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Lodge Workings</h1>

      <form onSubmit={add} className="card grid gap-3 max-w-xl">
        <div>
          <label>Month</label>
          <input
            type="month"
            value={monthInputValue}
            onChange={e=>{
              const value = e.target.value;
              if (!value) return;
              const [yy, mm] = value.split("-");
              const nextYear = parseInt(yy, 10);
              const nextMonth = parseInt(mm, 10);
              if (!Number.isNaN(nextYear)) setYear(nextYear);
              if (!Number.isNaN(nextMonth)) setMonth(nextMonth);
            }}
            min="2000-01"
            max="3000-12"
          />
        </div>
        <label>Work of the evening</label>
        <select value={work} onChange={e=>setWork(e.target.value as any)}>
          {WORKS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <label>Candidate name</label>
        <input value={candidateName} onChange={e=>setCandidate(e.target.value)} placeholder="If applicable" />
        <label>Notes</label>
        <textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
        <button className="btn btn-primary" disabled={loading}>{loading ? "Saving..." : "Add plan"}</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="py-2">Month</th><th>Work</th><th>Candidate</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="py-2">{String(i.month).padStart(2, "0")}/{i.year}</td>
                <td>{i.work}</td>
                <td>{i.candidateName ?? "—"}</td>
                <td>{i.notes ?? ""}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="py-4 text-sm text-gray-500">No plans yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
