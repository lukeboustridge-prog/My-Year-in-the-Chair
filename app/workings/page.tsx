"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

const WORKS = [
  "INITIATION",
  "PASSING",
  "RAISING",
  "INSTALLATION",
  "PRESENTATION",
  "LECTURE",
  "OTHER",
] as const;

type Item = {
  id: string;
  month: number;
  year: number;
  work: (typeof WORKS)[number];
  candidateName?: string | null;
  notes?: string | null;
  isGrandLodgeVisit?: boolean;
  isEmergencyMeeting?: boolean;
  hasTracingBoards?: boolean;
};

export default function WorkingsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [work, setWork] = useState<(typeof WORKS)[number]>("OTHER");
  const [candidateName, setCandidate] = useState("");
  const [notes, setNotes] = useState("");
  const [isGrandLodgeVisit, setGrandLodgeVisit] = useState(false);
  const [isEmergencyMeeting, setEmergencyMeeting] = useState(false);
  const [hasTracingBoards, setTracingBoards] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/workings", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const normalised: Item[] = (Array.isArray(data) ? data : []).map((row: any) => ({
        id: row.id,
        month: row.month,
        year: row.year,
        work: row.work ?? "OTHER",
        candidateName: row.candidateName ?? null,
        notes: row.notes ?? null,
        isGrandLodgeVisit: Boolean(row.isGrandLodgeVisit),
        isEmergencyMeeting: Boolean(row.isEmergencyMeeting),
        hasTracingBoards: Boolean(row.hasTracingBoards),
      }));
      setItems(normalised);
      setError(null);
    } catch (err: any) {
      console.error("WORKINGS_LOAD", err);
      setError(err?.message || "Failed to load lodge workings");
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/workings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          month,
          year,
          work,
          candidateName: candidateName || undefined,
          notes: notes || undefined,
          isGrandLodgeVisit,
          isEmergencyMeeting,
          hasTracingBoards,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCandidate("");
      setNotes("");
      setGrandLodgeVisit(false);
      setEmergencyMeeting(false);
      setTracingBoards(false);
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

      <form onSubmit={add} className="card max-w-xl">
        <div className="card-body grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Month</label>
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value || "1", 10))}
              />
            </div>
            <div>
              <label>Year</label>
              <input
                type="number"
                min={2000}
                max={3000}
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value || "2024", 10))}
              />
            </div>
          </div>
          <label>Work of the evening</label>
          <select value={work} onChange={(e) => setWork(e.target.value as (typeof WORKS)[number])}>
            {WORKS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <label>Candidate name</label>
          <input value={candidateName} onChange={(e) => setCandidate(e.target.value)} placeholder="If applicable" />
          <label>Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isGrandLodgeVisit}
                onChange={(e) => setGrandLodgeVisit(e.target.checked)}
              />
              Grand Lodge visit
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isEmergencyMeeting}
                onChange={(e) => setEmergencyMeeting(e.target.checked)}
              />
              Emergency meeting
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={hasTracingBoards}
                onChange={(e) => setTracingBoards(e.target.checked)}
              />
              Tracing boards delivered
            </label>
          </div>
          <button className="btn btn-primary self-start" disabled={loading}>
            {loading ? "Saving..." : "Add plan"}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="card-body overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500">
                <th className="py-2">Month</th>
                <th>Work</th>
                <th>Candidate</th>
                <th>Grand Lodge</th>
                <th>Emergency</th>
                <th>Tracing Boards</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="py-2">
                    {new Date(i.year, i.month - 1).toLocaleString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td>{i.work.replace(/_/g, " ")}</td>
                  <td>{i.candidateName ?? "—"}</td>
                  <td>{i.isGrandLodgeVisit ? "Yes" : "No"}</td>
                  <td>{i.isEmergencyMeeting ? "Yes" : "No"}</td>
                  <td>{i.hasTracingBoards ? "Yes" : "No"}</td>
                  <td>{i.notes ?? ""}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-sm text-gray-500">
                    No plans yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
