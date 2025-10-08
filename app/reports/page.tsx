'use client';

import { useEffect, useMemo, useState } from "react";

type VisitRecord = {
  id?: string;
  date: string;
  lodgeName: string;
  lodgeNumber?: string | null;
  workOfEvening: string;
  candidateName?: string | null;
  comments?: string | null;
  isGrandLodgeVisit?: boolean;
  hasTracingBoards?: boolean;
};

type WorkingRecord = {
  id?: string;
  date: string;
  work: string;
  candidateName?: string | null;
  comments?: string | null;
  isGrandLodgeVisit?: boolean;
  isEmergencyMeeting?: boolean;
  hasFirstTracingBoard?: boolean;
  hasSecondTracingBoard?: boolean;
  hasThirdTracingBoard?: boolean;
  hasTracingBoards?: boolean;
};

type ProfileRecord = {
  prefix?: string | null;
  name?: string | null;
  postNominals?: string[];
  lodgeName?: string | null;
  lodgeNumber?: string | null;
  termStart?: string | null;
  termEnd?: string | null;
};

const WORK_LABELS: Record<string, string> = {
  INITIATION: "First Degree",
  PASSING: "Second Degree",
  RAISING: "Third Degree",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Other",
};

function formatWork(work: string | undefined | null) {
  if (!work) return "";
  return WORK_LABELS[work] ?? work.replace(/_/g, " ");
}

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [workings, setWorkings] = useState<WorkingRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, visitsRes, workRes] = await Promise.all([
          fetch("/api/profile", { credentials: "include" }),
          fetch("/api/visits", { credentials: "include" }),
          fetch("/api/mywork", { credentials: "include" }),
        ]);

        if (!profileRes.ok) throw new Error("Failed to load profile");
        if (!visitsRes.ok) throw new Error("Failed to load visits");
        if (!workRes.ok) throw new Error("Failed to load lodge work");

        const profileJson = await profileRes.json();
        setProfile(profileJson);

        const visitJson = await visitsRes.json();
        setVisits(
          (Array.isArray(visitJson) ? visitJson : []).map((row: any) => ({
            id: row.id,
            date: row.date ?? row.dateISO ?? "",
            lodgeName: row.lodgeName ?? "",
            lodgeNumber: row.lodgeNumber ?? null,
            workOfEvening: row.workOfEvening ?? row.eventType ?? "OTHER",
            candidateName: row.candidateName ?? null,
            comments: row.comments ?? row.notes ?? null,
            isGrandLodgeVisit: Boolean(row.isGrandLodgeVisit),
            hasTracingBoards: Boolean(row.hasTracingBoards),
          }))
        );

        const workJson = await workRes.json();
        setWorkings(
          (Array.isArray(workJson) ? workJson : []).map((row: any) => ({
            id: row.id,
            date: row.date ?? row.dateISO ?? "",
            work: row.work ?? row.degree ?? "OTHER",
            candidateName: row.candidateName ?? null,
            comments: row.comments ?? row.notes ?? null,
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
          }))
        );

        setError(null);
      } catch (err: any) {
        console.error("REPORTS_LOAD", err);
        setError(err?.message || "Unable to load report data");
      }
    })();
  }, []);

  const filteredVisits = useMemo(() => {
    if (!visits.length) return [] as VisitRecord[];
    const fromTime = from ? new Date(from).getTime() : null;
    const toTime = to ? new Date(to).getTime() : null;
    return visits.filter((visit) => {
      const visitTime = new Date(visit.date).getTime();
      if (Number.isNaN(visitTime)) return true;
      if (fromTime && visitTime < fromTime) return false;
      if (toTime && visitTime > toTime) return false;
      return true;
    });
  }, [visits, from, to]);

  function extractFilename(contentDisposition: string | null) {
    if (!contentDisposition) return null;
    const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return match?.[1] ?? null;
  }

  async function generateReport(mode: "term" | "custom") {
    if (mode === "custom" && (!from || !to)) {
      setError("Select both a start and end date for a custom report.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (mode === "custom") {
        params.set("period", "custom");
        params.set("from", from);
        params.set("to", to);
      } else if (profile?.termStart && profile?.termEnd) {
        const now = new Date();
        const start = new Date(profile.termStart);
        const end = new Date(profile.termEnd);
        if (start instanceof Date && end instanceof Date && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
          if (now < start || now > end) {
            params.set("term", "current");
          }
        }
      }
      const query = params.toString();
      const res = await fetch(`/api/reports/gsr${query ? `?${query}` : ""}`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        const message = await res.text();
        setError(message || "Unable to generate the PDF report.");
        return;
      }
      const blob = await res.blob();
      const filename = extractFilename(res.headers.get("Content-Disposition")) ?? "Grand-Superintendent-of-Region-Report.pdf";
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Unable to generate the PDF report.");
    } finally {
      setBusy(false);
    }
  }

  const visitSummary = filteredVisits.length;
  const workingSummary = workings.length;
  const termReady = Boolean(profile?.termStart && profile?.termEnd);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h1">Reports</h1>
          <p className="subtle">Export a PDF summary of your year in the chair.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
            <label className="label">
              <span>From</span>
              <input className="input mt-1" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label className="label">
              <span>To</span>
              <input className="input mt-1" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <button
                className="btn-soft w-full sm:w-auto"
                onClick={() => generateReport("term")}
                disabled={busy || !profile}
              >
                {busy ? 'Working…' : 'Generate for current term'}
              </button>
              <button
                className="btn-primary w-full sm:w-auto"
                onClick={() => generateReport("custom")}
                disabled={busy || !from || !to}
              >
                {busy ? 'Working…' : 'Generate custom period'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="subtle">Visits in range</div>
              <div className="text-lg font-semibold">{visitSummary}</div>
            </div>
            <div>
              <div className="subtle">Total lodge workings</div>
              <div className="text-lg font-semibold">{workingSummary}</div>
            </div>
            <div>
              <div className="subtle">Term configured</div>
              <div className="text-lg font-semibold">{termReady ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && !visits.length && !workings.length && (
            <p className="text-sm text-slate-500">Add lodge visits and workings to unlock the Grand Superintendent report.</p>
          )}
        </div>
      </div>
    </div>
  );
}