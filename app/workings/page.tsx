"use client";
import { useEffect, useMemo, useState } from "react";
import { toDisplayDate, toISODate } from "@/lib/date";

const WORK_OPTIONS = [
  { value: "INITIATION", label: "Initiation" },
  { value: "PASSING", label: "Passing" },
  { value: "RAISING", label: "Raising" },
  { value: "INSTALLATION", label: "Installation" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "LECTURE", label: "Lecture" },
  { value: "OTHER", label: "Other" },
] as const;

type WorkType = (typeof WORK_OPTIONS)[number]["value"];

type Item = {
  id: string;
  meetingDate: string | null;
  month: number;
  year: number;
  work: WorkType;
  candidateName?: string | null;
  lecture?: string | null;
  tracingBoard1?: boolean | null;
  tracingBoard2?: boolean | null;
  tracingBoard3?: boolean | null;
  notes?: string | null;
};

const DEFAULT_DATE = toISODate(new Date().toISOString());

function normaliseItem(raw: any): Item {
  const meetingDate = raw?.meetingDate ? toISODate(raw.meetingDate) : null;
  const month = raw?.month ?? (meetingDate ? Number(meetingDate.split("-")[1]) : 0);
  const year = raw?.year ?? (meetingDate ? Number(meetingDate.split("-")[0]) : 0);
  return {
    id: String(raw?.id ?? `${meetingDate ?? ""}-${raw?.work ?? ""}`),
    meetingDate,
    month,
    year,
    work: (raw?.work as WorkType) ?? "OTHER",
    candidateName: raw?.candidateName ?? null,
    lecture: raw?.lecture ?? null,
    tracingBoard1: raw?.tracingBoard1 ?? false,
    tracingBoard2: raw?.tracingBoard2 ?? false,
    tracingBoard3: raw?.tracingBoard3 ?? false,
    notes: raw?.notes ?? raw?.comments ?? null,
  };
}

function formatTracingBoards(item: Item) {
  const boards = [
    item.tracingBoard1 ? "1" : null,
    item.tracingBoard2 ? "2" : null,
    item.tracingBoard3 ? "3" : null,
  ].filter(Boolean);
  return boards.length ? boards.join(", ") : "—";
}

export default function WorkingsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [meetingDate, setMeetingDate] = useState<string>(DEFAULT_DATE);
  const [work, setWork] = useState<WorkType>("OTHER");
  const [candidateName, setCandidate] = useState("");
  const [lecture, setLecture] = useState("");
  const [notes, setNotes] = useState("");
  const [tracingBoard1, setTracingBoard1] = useState(false);
  const [tracingBoard2, setTracingBoard2] = useState(false);
  const [tracingBoard3, setTracingBoard3] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workOptions = useMemo(() => WORK_OPTIONS, []);

  async function load() {
    try {
      const res = await fetch("/api/workings", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const normalised = Array.isArray(data) ? data.map(normaliseItem) : [];
      setItems(normalised);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Unable to load lodge workings");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setMeetingDate(DEFAULT_DATE);
    setWork("OTHER");
    setCandidate("");
    setLecture("");
    setNotes("");
    setTracingBoard1(false);
    setTracingBoard2(false);
    setTracingBoard3(false);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const isoDate = toISODate(meetingDate);
    if (!isoDate) {
      setError("Please choose a meeting date.");
      return;
    }
    const [yearStr, monthStr] = isoDate.split("-");
    const month = Number(monthStr);
    const year = Number(yearStr);
    if (!month || !year) {
      setError("Month and year could not be determined from the meeting date.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          meetingDate: isoDate,
          month,
          year,
          work,
          candidateName: candidateName.trim() || undefined,
          lecture: lecture.trim() || undefined,
          tracingBoard1,
          tracingBoard2,
          tracingBoard3,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const created = normaliseItem(await res.json());
      setItems((prev) => [created, ...prev]);
      resetForm();
    } catch (err: any) {
      setError(err?.message || "Unable to save lodge working");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Lodge Workings</h1>

      <form onSubmit={add} className="card grid gap-4 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="label">
            <span>Date</span>
            <input
              type="date"
              className="input mt-1"
              value={meetingDate}
              onChange={(e) => setMeetingDate(toISODate(e.target.value))}
              required
            />
          </label>
          <label className="label">
            <span>Work of the evening</span>
            <select
              className="input mt-1"
              value={work}
              onChange={(e) => setWork(e.target.value as WorkType)}
            >
              {workOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="label">
            <span>Candidate</span>
            <input
              className="input mt-1"
              value={candidateName}
              onChange={(e) => setCandidate(e.target.value)}
              placeholder="If applicable"
            />
          </label>
          <label className="label">
            <span>Lecture</span>
            <input
              className="input mt-1"
              value={lecture}
              onChange={(e) => setLecture(e.target.value)}
              placeholder="Lecture or presentation details"
            />
          </label>
        </div>
        <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <legend className="label text-sm font-semibold">Tracing Boards</legend>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={tracingBoard1}
              onChange={(e) => setTracingBoard1(e.target.checked)}
            />
            <span>Tracing Board 1</span>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={tracingBoard2}
              onChange={(e) => setTracingBoard2(e.target.checked)}
            />
            <span>Tracing Board 2</span>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={tracingBoard3}
              onChange={(e) => setTracingBoard3(e.target.checked)}
            />
            <span>Tracing Board 3</span>
          </label>
        </fieldset>
        <label className="label">
          <span>Notes</span>
          <textarea
            rows={3}
            className="input mt-1"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Add plan"}
          </button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 uppercase tracking-wide text-xs">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Month</th>
              <th className="py-2 pr-3">Work</th>
              <th className="py-2 pr-3">Candidate</th>
              <th className="py-2 pr-3">Lecture</th>
              <th className="py-2 pr-3">Tracing Boards</th>
              <th className="py-2 pr-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="py-2 pr-3">{item.meetingDate ? toDisplayDate(item.meetingDate) : "—"}</td>
                <td className="py-2 pr-3">{item.month && item.year ? `${String(item.month).padStart(2, "0")}/${item.year}` : "—"}</td>
                <td className="py-2 pr-3">{workOptions.find((opt) => opt.value === item.work)?.label ?? item.work}</td>
                <td className="py-2 pr-3">{item.candidateName || "—"}</td>
                <td className="py-2 pr-3">{item.lecture || "—"}</td>
                <td className="py-2 pr-3">{formatTracingBoards(item)}</td>
                <td className="py-2 pr-3 whitespace-pre-wrap">{item.notes ? item.notes : "—"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">
                  No lodge workings planned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
