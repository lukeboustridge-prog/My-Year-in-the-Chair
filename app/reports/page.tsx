'use client';

import { useEffect, useMemo, useState } from "react";

import type { Profile as PdfProfile, Visit as PdfVisit, Office as PdfOffice } from "@/src/utils/pdfReport";
import { downloadFullPdf, downloadVisitsPdf } from "@/src/utils/pdfReport";

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

  const pdfProfile: PdfProfile | null = useMemo(() => {
    if (!profile) return null;
    const fullName = profile.name || "Master";
    return {
      prefix: profile.prefix ?? undefined,
      fullName,
      postNominals: Array.isArray(profile.postNominals) ? profile.postNominals.join(", ") : undefined,
    };
  }, [profile]);

  const pdfVisits: PdfVisit[] = useMemo(
    () =>
      filteredVisits.map((visit) => ({
        dateISO: visit.date,
        lodgeName: [visit.lodgeName, visit.lodgeNumber ? `No. ${visit.lodgeNumber}` : ""].filter(Boolean).join(" "),
        eventType: formatWork(visit.workOfEvening),
        role: visit.isGrandLodgeVisit ? "Grand Lodge" : undefined,
        notes: [
          visit.candidateName,
          visit.hasTracingBoards ? "Tracing boards" : null,
          visit.comments,
        ]
          .filter(Boolean)
          .join(" — "),
      })),
    [filteredVisits]
  );

  const pdfOffices: PdfOffice[] = useMemo(() => {
    if (!profile) return [];
    return workings.map((record) => ({
      lodgeName: profile.lodgeName || "My Lodge",
      office: (() => {
        const parts: string[] = [];
        const base = formatWork(record.work);
        if (base) parts.push(base);
        if (record.candidateName) parts.push(record.candidateName);
        const tags = [
          record.isGrandLodgeVisit ? "Grand Lodge" : null,
          record.isEmergencyMeeting ? "Emergency meeting" : null,
          record.hasFirstTracingBoard ? "1st tracing board" : null,
          record.hasSecondTracingBoard ? "2nd tracing board" : null,
          record.hasThirdTracingBoard ? "3rd tracing board" : null,
        ].filter(Boolean);
        if (tags.length) parts.push(tags.join(" • "));
        return parts.join(" – ");
      })(),
      startDateISO: record.date,
      isGrandLodge: Boolean(record.isGrandLodgeVisit),
      endDateISO: undefined,
    }));
  }, [workings, profile]);

  async function onExportVisits() {
    if (!pdfProfile) {
      alert('Profile not loaded yet.');
      return;
    }
    setBusy(true);
    try {
      await downloadVisitsPdf(pdfProfile, pdfVisits, {
        title: "Visits Report",
        dateFrom: from || undefined,
        dateTo: to || undefined,
        includeNotes: true,
      });
    } finally {
      setBusy(false);
    }
  }

  async function onExportFull() {
    if (!pdfProfile) {
      alert('Profile not loaded yet.');
      return;
    }
    setBusy(true);
    try {
      await downloadFullPdf(pdfProfile, pdfVisits, pdfOffices, {
        title: "My Year in the Chair – Full Report",
        dateFrom: from || undefined,
        dateTo: to || undefined,
        includeNotes: true,
      });
    } finally {
      setBusy(false);
    }
  }

  const visitSummary = filteredVisits.length;
  const workingSummary = workings.length;

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
                onClick={onExportVisits}
                disabled={busy || !pdfProfile || !pdfVisits.length}
              >
                {busy ? 'Working…' : 'Export Visits PDF'}
              </button>
              <button
                className="btn-primary w-full sm:w-auto"
                onClick={onExportFull}
                disabled={busy || !pdfProfile || !pdfVisits.length}
              >
                {busy ? 'Working…' : 'Export Full PDF'}
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
              <div className="subtle">Profile ready</div>
              <div className="text-lg font-semibold">{pdfProfile ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && !pdfVisits.length && (
            <p className="text-sm text-slate-500">Add visits to generate a PDF report.</p>
          )}
        </div>
      </div>
    </div>
  );
}