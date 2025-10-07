'use client';
import React from "react";
import { toISODate } from "@/lib/date";

type Profile = {
  prefix?: string | null;
  name?: string | null;
  fullName?: string | null;
  postNominals?: string[] | string | null;
};

type Visit = {
  id: string;
  date: string;
  lodgeName: string;
  lodgeNumber?: string;
  workOfEvening?: string;
  notes?: string;
};

type LodgeWorking = {
  id: string;
  meetingDate: string;
  work: string;
  candidateName?: string;
  lecture?: string;
  notes?: string;
  grandLodgeVisit?: boolean;
  emergencyMeeting?: boolean;
};

type PdfState = {
  profile: Profile | null;
  visits: Visit[];
  workings: LodgeWorking[];
};

const WORK_LABELS: Record<string, string> = {
  INITIATION: "Initiation",
  PASSING: "Passing",
  RAISING: "Raising",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Other",
};

function normaliseProfile(raw: any): Profile {
  if (!raw || typeof raw !== "object") return {};
  const postNominals = Array.isArray(raw.postNominals)
    ? raw.postNominals.filter((item: unknown): item is string => typeof item === "string")
    : typeof raw.postNominals === "string"
    ? raw.postNominals.split(",").map((part: string) => part.trim()).filter(Boolean)
    : [];
  return {
    ...raw,
    postNominals,
  };
}

function normaliseVisit(raw: any): Visit {
  const date = toISODate(raw?.date ?? raw?.dateISO ?? "") || "";
  return {
    id: String(raw?.id ?? `${date}-${raw?.lodgeName ?? ""}`),
    date,
    lodgeName: raw?.lodgeName ?? "",
    lodgeNumber: raw?.lodgeNumber ?? "",
    workOfEvening: raw?.workOfEvening ?? raw?.eventType ?? "",
    notes: raw?.notes ?? raw?.comments ?? "",
  };
}

function normaliseWorking(raw: any): LodgeWorking {
  const isoDate = toISODate(raw?.meetingDate ?? "");
  let fallbackDate = "";
  if (!isoDate && raw?.year && raw?.month) {
    const year = String(raw.year).padStart(4, "0");
    const month = String(raw.month).padStart(2, "0");
    fallbackDate = `${year}-${month}-01`;
  }
  return {
    id: String(raw?.id ?? `${isoDate || fallbackDate}-${raw?.work ?? ""}`),
    meetingDate: isoDate || fallbackDate,
    work: raw?.work ?? "",
    candidateName: raw?.candidateName ?? undefined,
    lecture: raw?.lecture ?? undefined,
    notes: raw?.notes ?? raw?.comments ?? undefined,
    grandLodgeVisit: Boolean(raw?.grandLodgeVisit),
    emergencyMeeting: Boolean(raw?.emergencyMeeting),
  };
}

function getBaseName(profile: Profile | null) {
  if (!profile) return "";
  const value = typeof profile.fullName === "string" && profile.fullName.trim().length > 0
    ? profile.fullName
    : typeof profile.name === "string"
    ? profile.name
    : "";
  return value.trim();
}

function getDisplayName(profile: Profile | null) {
  if (!profile) return "";
  const base = getBaseName(profile);
  const postNominals = Array.isArray(profile.postNominals)
    ? profile.postNominals.join(", ")
    : typeof profile.postNominals === "string"
    ? profile.postNominals
    : "";
  const parts = [profile.prefix, base, postNominals]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
  return parts.join(" ");
}

function filterByRange<T>(items: T[], from: string, to: string, getDate: (item: T) => string) {
  if (!from && !to) return items;
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  return items.filter((item) => {
    const raw = getDate(item);
    if (!raw) return true;
    const value = new Date(raw);
    if (isNaN(value.getTime())) return true;
    if (fromDate && value < fromDate) return false;
    if (toDate) {
      const toInclusive = new Date(toDate);
      toInclusive.setHours(23, 59, 59, 999);
      if (value > toInclusive) return false;
    }
    return true;
  });
}

export default function ReportsPage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [{ profile, visits, workings }, setState] = React.useState<PdfState>({
    profile: null,
    visits: [],
    workings: [],
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<"visits" | "full" | "gsr" | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [profileRes, visitsRes, workingsRes] = await Promise.all([
          fetch("/api/profile", { credentials: "include" }),
          fetch("/api/visits", { credentials: "include" }),
          fetch("/api/workings", { credentials: "include" }),
        ]);
        if (!profileRes.ok) throw new Error(await profileRes.text());
        if (!visitsRes.ok) throw new Error(await visitsRes.text());
        if (!workingsRes.ok) throw new Error(await workingsRes.text());
        const profileData = normaliseProfile(await profileRes.json().catch(() => ({})));
        const visitData = await visitsRes.json().catch(() => []);
        const normalisedVisits = Array.isArray(visitData)
          ? visitData.map(normaliseVisit).sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))
          : [];
        const workingsData = await workingsRes.json().catch(() => []);
        const normalisedWorkings = Array.isArray(workingsData)
          ? workingsData
              .map(normaliseWorking)
              .sort((a, b) => (a.meetingDate > b.meetingDate ? -1 : a.meetingDate < b.meetingDate ? 1 : 0))
          : [];
        if (!cancelled) {
          setState({ profile: profileData, visits: normalisedVisits, workings: normalisedWorkings });
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Unable to load data for reports");
          setState({ profile: null, visits: [], workings: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visitsDisabled = loading || !!error || visits.length === 0;
  const gsrDisabled = loading || !!error || workings.length === 0 || !profile;

  async function exportPdf(kind: "visits" | "full" | "gsr") {
    if (!profile) return;
    setBusy(kind);
    try {
      const filteredVisits = filterByRange(visits, from, to, (visit) => visit.date);
      const filteredWorkings = filterByRange(workings, from, to, (work) => work.meetingDate);
      if (kind !== "gsr" && filteredVisits.length === 0) {
        alert("No visits found in the selected range.");
        return;
      }
      if (kind === "gsr" && filteredWorkings.length === 0) {
        alert("No lodge workings found in the selected range.");
        return;
      }
      const { downloadVisitsPdf, downloadFullPdf, downloadGsrReport } = await import("@/lib/pdfReport");
      const baseName = getBaseName(profile) || "Member";
      const pdfProfile = {
        prefix: profile.prefix ?? undefined,
        fullName: baseName,
        postNominals: Array.isArray(profile.postNominals)
          ? profile.postNominals.join(", ")
          : profile.postNominals ?? undefined,
      };
      const pdfVisits = filteredVisits.map((visit) => ({
        dateISO: visit.date,
        lodgeName: [visit.lodgeName, visit.lodgeNumber ? `No. ${visit.lodgeNumber}` : ""].filter(Boolean).join(" "),
        eventType: WORK_LABELS[visit.workOfEvening ?? ""] || visit.workOfEvening || "Visit",
        notes: visit.notes,
      }));
      if (kind === "visits") {
        await downloadVisitsPdf(pdfProfile, pdfVisits, {
          dateFrom: from || undefined,
          dateTo: to || undefined,
          includeNotes: true,
        });
      } else if (kind === "full") {
        await downloadFullPdf(pdfProfile, pdfVisits, [], {
          dateFrom: from || undefined,
          dateTo: to || undefined,
          includeNotes: true,
        });
      } else {
        await downloadGsrReport(
          {
            ...pdfProfile,
            lodgeName: profile.lodgeName ?? undefined,
            lodgeNumber: profile.lodgeNumber ?? undefined,
            region: profile.region ?? undefined,
          },
          filteredWorkings.map((item) => ({
            dateISO: item.meetingDate,
            work: item.work,
            candidateName: item.candidateName,
            lecture: item.lecture,
            notes: item.notes,
            grandLodgeVisit: item.grandLodgeVisit,
            emergencyMeeting: item.emergencyMeeting,
          })),
          {
            dateFrom: from || undefined,
            dateTo: to || undefined,
          },
        );
      }
    } catch (err: any) {
      console.error("REPORTS_EXPORT", err);
      alert(err?.message || "Unable to generate PDF");
    } finally {
      setBusy(null);
    }
  }

  const nameLine = getDisplayName(profile) || "your profile";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Reports</h1>
        <span className="subtle">Generate PDFs from your records</span>
      </div>

      <div className="card">
        <div className="card-body space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-slate-600">
              Prepare a PDF summary for {nameLine}. Filter by date range if needed and include visit notes automatically.
            </p>
            {loading && <p className="subtle">Loading your data…</p>}
            {!loading && visits.length === 0 && !error && (
              <p className="subtle">No visits recorded yet. Add a visit to enable exports.</p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <label className="label">
              <span>From</span>
              <input
                className="input mt-1"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="label">
              <span>To</span>
              <input className="input mt-1" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-soft"
                onClick={() => exportPdf("visits")}
                disabled={visitsDisabled || busy === "full" || busy === "visits" || busy === "gsr"}
              >
                {busy === "visits" ? "Generating…" : "Export Visits"}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => exportPdf("full")}
                disabled={visitsDisabled || busy === "full" || busy === "visits" || busy === "gsr"}
              >
                {busy === "full" ? "Generating…" : "Export Full"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-soft"
              onClick={() => exportPdf("gsr")}
              disabled={gsrDisabled || busy === "gsr" || busy === "full" || busy === "visits"}
            >
              {busy === "gsr" ? "Generating…" : "Export GSR Report"}
            </button>
            {gsrDisabled && !loading && !error && (
              <span className="subtle text-xs">Add lodge workings to enable the Grand Superintendent report.</span>
            )}
          </div>

          <p className="subtle text-sm">
            The downloads are created in your browser using the jspdf generator. Ensure pop-ups/downloads are permitted.
          </p>
        </div>
      </div>
    </div>
  );
}