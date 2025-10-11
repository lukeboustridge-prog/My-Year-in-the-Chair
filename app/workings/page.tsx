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
const WORK_LABELS: Record<(typeof WORKS)[number], string> = {
  INITIATION: "First Degree",
  PASSING: "Second Degree",
  RAISING: "Third Degree",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Other",
};

type Item = {
  id: string;
  month: number;
  year: number;
  work: (typeof WORKS)[number];
  candidateName?: string | null;
  notes?: string | null;
  isGrandLodgeVisit?: boolean;
  isEmergencyMeeting?: boolean;
  hasFirstTracingBoard?: boolean;
  hasSecondTracingBoard?: boolean;
  hasThirdTracingBoard?: boolean;
  hasTracingBoards?: boolean;
  displayOnEventsPage?: boolean;
  rsvpCount?: number;
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
  const [hasFirstTracingBoard, setFirstTracingBoard] = useState(false);
  const [hasSecondTracingBoard, setSecondTracingBoard] = useState(false);
  const [hasThirdTracingBoard, setThirdTracingBoard] = useState(false);
  const [displayOnEventsPage, setDisplayOnEventsPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
        hasFirstTracingBoard: Boolean(row.hasFirstTracingBoard),
        hasSecondTracingBoard: Boolean(row.hasSecondTracingBoard),
        hasThirdTracingBoard: Boolean(row.hasThirdTracingBoard),
        hasTracingBoards: Boolean(
          row.hasTracingBoards ||
            row.hasFirstTracingBoard ||
            row.hasSecondTracingBoard ||
            row.hasThirdTracingBoard
        ),
        displayOnEventsPage: Boolean(row.displayOnEventsPage),
        rsvpCount: typeof row.rsvpCount === "number" ? row.rsvpCount : 0,
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
          hasFirstTracingBoard,
          hasSecondTracingBoard,
          hasThirdTracingBoard,
          hasTracingBoards:
            hasFirstTracingBoard || hasSecondTracingBoard || hasThirdTracingBoard || undefined,
          displayOnEventsPage,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCandidate("");
      setNotes("");
      setGrandLodgeVisit(false);
      setEmergencyMeeting(false);
      setFirstTracingBoard(false);
      setSecondTracingBoard(false);
      setThirdTracingBoard(false);
      setDisplayOnEventsPage(false);
      await load();
    } catch (err: any) {
      console.error("WORKINGS_SAVE", err);
      alert(err?.message || "Failed to save plan");
    } finally {
      setLoading(false);
    }
  }

  async function updateDisplay(id: string, nextValue: boolean) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/workings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayOnEventsPage: nextValue }),
      });
      if (!res.ok) throw new Error(await res.text());
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, displayOnEventsPage: nextValue } : item,
        ),
      );
    } catch (err: any) {
      console.error("WORKINGS_UPDATE", err);
      alert(err?.message || "Failed to update event visibility");
    } finally {
      setUpdatingId(null);
    }
  }

  const mobileItems = items.map((i) => {
    const monthLabel = new Date(i.year, i.month - 1).toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
    const isVisible = Boolean(i.displayOnEventsPage);
    const isUpdating = updatingId === i.id;
    return (
      <div key={i.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2">
          <div>
            <p className="font-medium text-slate-900">{WORK_LABELS[i.work] ?? i.work.replace(/_/g, " ")}</p>
            <p className="text-xs text-slate-500">{monthLabel}</p>
          </div>
          {i.candidateName ? (
            <p className="text-sm text-slate-600">
              Candidate: <span className="font-medium">{i.candidateName}</span>
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
              Grand Lodge: {i.isGrandLodgeVisit ? "Yes" : "No"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
              Emergency: {i.isEmergencyMeeting ? "Yes" : "No"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
              1st TB: {i.hasFirstTracingBoard ? "Yes" : "No"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
              2nd TB: {i.hasSecondTracingBoard ? "Yes" : "No"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
              3rd TB: {i.hasThirdTracingBoard ? "Yes" : "No"}
            </span>
          </div>
          {i.notes ? <p className="text-sm text-slate-600">{i.notes}</p> : null}
          <div className="flex flex-col gap-2 text-xs text-slate-600">
            <span className="font-medium">RSVPs: {i.rsvpCount ?? 0}</span>
            <button
              type="button"
              onClick={() => updateDisplay(i.id, !isVisible)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : isVisible ? "Hide from events" : "Show on events"}
            </button>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="h1">My Lodge Workings</h1>
        <p className="subtle">Plan and record workings, tracing boards, and special meetings.</p>
      </div>

      <form onSubmit={add} className="card w-full max-w-2xl mx-auto">
        <div className="card-body grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="label">
              <span>Month</span>
              <input
                className="input mt-1"
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value || "1", 10))}
              />
            </label>
            <label className="label">
              <span>Year</span>
              <input
                className="input mt-1"
                type="number"
                min={2000}
                max={3000}
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value || "2024", 10))}
              />
            </label>
          </div>
          <label className="label">
            <span>Work of the evening</span>
            <select
              className="input mt-1"
              value={work}
              onChange={(e) => setWork(e.target.value as (typeof WORKS)[number])}
            >
              {WORKS.map((w) => (
                <option key={w} value={w}>
                  {WORK_LABELS[w] ?? w}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            <span>Candidate name</span>
            <input
              className="input mt-1"
              value={candidateName}
              onChange={(e) => setCandidate(e.target.value)}
              placeholder="If applicable"
            />
          </label>
          <label className="label">
            <span>Notes</span>
            <textarea
              className="input mt-1"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
                checked={hasFirstTracingBoard}
                onChange={(e) => setFirstTracingBoard(e.target.checked)}
              />
              1st tracing board
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={hasSecondTracingBoard}
                onChange={(e) => setSecondTracingBoard(e.target.checked)}
              />
              2nd tracing board
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={hasThirdTracingBoard}
                onChange={(e) => setThirdTracingBoard(e.target.checked)}
              />
              3rd tracing board
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={displayOnEventsPage}
              onChange={(event) => setDisplayOnEventsPage(event.target.checked)}
            />
            Display on events page
          </label>
          <p className="text-xs text-slate-500">
            Tick to promote this working on the shared Upcoming Events page.
          </p>
          <button className="btn-primary w-full sm:w-auto sm:self-start" disabled={loading}>
            {loading ? "Saving..." : "Add plan"}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="card-body">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Month</th>
                  <th>Work</th>
                  <th>Candidate</th>
                  <th>Grand Lodge</th>
                  <th>Emergency</th>
                  <th>1st TB</th>
                  <th>2nd TB</th>
                  <th>3rd TB</th>
                  <th>Notes</th>
                  <th>RSVPs</th>
                  <th>Events</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="py-2">
                      {new Date(i.year, i.month - 1).toLocaleString(undefined, {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td>{WORK_LABELS[i.work] ?? i.work.replace(/_/g, " ")}</td>
                    <td>{i.candidateName ?? "—"}</td>
                    <td>{i.isGrandLodgeVisit ? "Yes" : "No"}</td>
                    <td>{i.isEmergencyMeeting ? "Yes" : "No"}</td>
                    <td>{i.hasFirstTracingBoard ? "Yes" : "No"}</td>
                    <td>{i.hasSecondTracingBoard ? "Yes" : "No"}</td>
                    <td>{i.hasThirdTracingBoard ? "Yes" : "No"}</td>
                    <td>{i.notes ?? ""}</td>
                    <td>{i.rsvpCount ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => updateDisplay(i.id, !i.displayOnEventsPage)}
                        disabled={updatingId === i.id}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingId === i.id
                          ? "Updating..."
                          : i.displayOnEventsPage
                          ? "Visible"
                          : "Hidden"}
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-4 text-sm text-slate-500">
                      No plans yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {items.length ? mobileItems : (
              <p className="text-sm text-slate-500">No plans yet.</p>
            )}
          </div>
        </div>
        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
