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
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth()+1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [work, setWork] = useState<typeof WORKS[number]>("OTHER");
  const [candidateName, setCandidate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/workings", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      console.error("WORKINGS_LOAD", err);
      setError(err?.message || "Failed to load lodge workings");
      setItems([]);
    }
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/workings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ month, year, work, candidateName: candidateName || undefined, notes: notes || undefined })
      });
      if (!res.ok) throw new Error(await res.text());
      setCandidate(""); setNotes("");
      await load();
    } catch (err: any) {
      console.error("WORKINGS_SAVE", err);
      alert(err?.message || "Failed to save plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Lodge Workings</h1>

      <form onSubmit={add} className="card grid gap-3 max-w-xl">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>Month</label>
            <input type="number" min={1} max={12} value={month} onChange={e=>setMonth(parseInt(e.target.value||"1",10))} />
          </div>
          <div>
            <label>Year</label>
            <input type="number" min={2000} max={3000} value={year} onChange={e=>setYear(parseInt(e.target.value||"2024",10))} />
          </div>
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
                <td className="py-2">{new Date(i.year, i.month - 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</td>
                <td>{i.work.replace(/_/g,' ')}</td>
                <td>{i.candidateName ?? "—"}</td>
                <td>{i.notes ?? ""}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="py-4 text-sm text-gray-500">No plans yet.</td></tr>}
          </tbody>
        </table>
        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
