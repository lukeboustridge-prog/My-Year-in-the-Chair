"use client";
import { useEffect, useState } from "react";

const WORKS = ["INITIATION","PASSING","RAISING","INSTALLATION","PRESENTATION","LECTURE","OTHER"] as const;

type Row = {
  id: string;
  date: string;
  work: typeof WORKS[number];
  candidateName?: string | null;
  comments?: string | null;
};

export default function MyWorkPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [work, setWork] = useState<typeof WORKS[number]>("OTHER");
  const [candidateName, setCandidate] = useState("");
  const [comments, setComments] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/my-work");
    if (res.ok) setRows(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/my-work", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        work,
        candidateName: candidateName || undefined,
        comments: comments || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setCandidate("");
      setComments("");
      await load();
    } else {
      alert(await res.text());
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Work</h1>
      <form onSubmit={submit} className="card grid gap-3 max-w-xl">
        <label>Date</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} required />

        <label>Work of the evening</label>
        <select value={work} onChange={e=>setWork(e.target.value as any)}>
          {WORKS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>

        <label>Candidate name</label>
        <input value={candidateName} onChange={e=>setCandidate(e.target.value)} placeholder="If applicable" />

        <label>Comments</label>
        <textarea rows={3} value={comments} onChange={e=>setComments(e.target.value)} placeholder="Notes, visitors, special observances..." />

        <button className="btn btn-primary" disabled={loading}>{loading ? "Saving..." : "Add record"}</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="py-2">Date</th><th>Work</th><th>Candidate</th><th>Comments</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="py-2">{new Date(r.date).toLocaleDateString()}</td>
                <td>{r.work}</td>
                <td>{r.candidateName ?? "—"}</td>
                <td>{r.comments ?? ""}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-4 text-sm text-gray-500">No work recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
