"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { REGIONS } from "@/lib/regions";

const WORKS = ["INITIATION","PASSING","RAISING","INSTALLATION","PRESENTATION","LECTURE","OTHER"] as const;
const WORK_LABELS: Record<(typeof WORKS)[number], string> = {
  INITIATION: "First Degree",
  PASSING: "Second Degree",
  RAISING: "Third Degree",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Other",
};

export default function NewVisitPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [lodgeName, setLodgeName] = useState("");
  const [lodgeNumber, setLodgeNumber] = useState("");
  const [workOfEvening, setWork] = useState<typeof WORKS[number]>("OTHER");
  const [candidateName, setCandidate] = useState("");
  const [isGrandLodgeVisit, setGrandLodgeVisit] = useState(false);
  const [hasTracingBoards, setTracingBoards] = useState(false);
  const [grandMasterInAttendance, setGrandMasterInAttendance] = useState(false);
  const [regionName, setRegionName] = useState("");
  const [accompanyingBrethrenCount, setAccompanyingBrethrenCount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const rank = typeof data?.rank === "string" ? data.rank : "";
        const isSittingMaster = Boolean(data?.isSittingMaster);
        setIsMaster(
          isSittingMaster || rank.trim().toLowerCase() === "worshipful master",
        );
      } catch (err) {
        console.error("PROFILE_LOAD", err);
      }
    })();
  }, []);

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
        workOfEvening,
        candidateName: candidateName || undefined,
        isGrandLodgeVisit,
        hasTracingBoards,
        grandMasterInAttendance,
        regionName: regionName || undefined,
        notes: notes || undefined,
        accompanyingBrethrenCount: isMaster ? Math.max(0, Math.round(accompanyingBrethrenCount)) : undefined,
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

        <label>Lodge region</label>
        <select value={regionName} onChange={e=>setRegionName(e.target.value)}>
          <option value="">Select a region</option>
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>

        <label>Work of the evening</label>
        <select value={workOfEvening} onChange={e=>setWork(e.target.value as any)}>
          {WORKS.map(w => (
            <option key={w} value={w}>
              {WORK_LABELS[w] ?? w}
            </option>
          ))}
        </select>

        <label>Candidate name</label>
        <input value={candidateName} onChange={e=>setCandidate(e.target.value)} placeholder="If applicable" />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={isGrandLodgeVisit}
            onChange={e=>setGrandLodgeVisit(e.target.checked)}
          />
          Grand Lodge visit
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={hasTracingBoards}
            onChange={e=>setTracingBoards(e.target.checked)}
          />
          Tracing boards delivered
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={grandMasterInAttendance}
            onChange={e=>setGrandMasterInAttendance(e.target.checked)}
          />
          Grand Master in attendance
        </label>

        {isMaster ? (
          <label>
            Brethren accompanying you
            <input
              type="number"
              min={0}
              step={1}
              value={accompanyingBrethrenCount}
              onChange={e => {
                const parsed = Number(e.target.value);
                if (!Number.isFinite(parsed) || parsed < 0) {
                  setAccompanyingBrethrenCount(0);
                } else {
                  setAccompanyingBrethrenCount(Math.round(parsed));
                }
              }}
            />
            <span className="text-xs text-slate-500">
              Earn 0.5 points for each accompanying Brother.
            </span>
          </label>
        ) : null}

        <label>Notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} />

        <button className="btn btn-primary mt-2" disabled={loading}>{loading ? "Saving..." : "Save visit"}</button>
      </form>
    </div>
  );
}
