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

type PdfState = {
  profile: Profile | null;
  visits: Visit[];
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

function filterByRange(visits: Visit[], from: string, to: string) {
  if (!from && !to) return visits;
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  return visits.filter((visit) => {
    const value = new Date(visit.date);
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
  const [{ profile, visits }, setState] = React.useState<PdfState>({ profile: null, visits: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<"visits" | "full" | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [profileRes, visitsRes] = await Promise.all([
          fetch("/api/profile", { credentials: "include" }),
          fetch("/api/visits", { credentials: "include" }),
        ]);
        if (!profileRes.ok) throw new Error(await profileRes.text());
        if (!visitsRes.ok) throw new Error(await visitsRes.text());
        const profileData = normaliseProfile(await profileRes.json().catch(() => ({})));
        const visitData = await visitsRes.json().catch(() => []);
        const normalisedVisits = Array.isArray(visitData)
          ? visitData.map(normaliseVisit).sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))
          : [];
        if (!cancelled) {
          setState({ profile: profileData, visits: normalisedVisits });
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Unable to load data for reports");
          setState({ profile: null, visits: [] });
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

  const disabled = loading || !!error || visits.length === 0;

  async function exportPdf(kind: "visits" | "full") {
    if (!profile || visits.length === 0) return;
    setBusy(kind);
    try {
      const filtered = filterByRange(visits, from, to);
      if (filtered.length === 0) {
        alert("No visits found in the selected range.");
        return;
      }
      const { downloadVisitsPdf, downloadFullPdf } = await import("@/lib/pdfReport");
      const baseName = getBaseName(profile) || "Member";
      const pdfProfile = {
        prefix: profile.prefix ?? undefined,
        fullName: baseName,
        postNominals: Array.isArray(profile.postNominals)
          ? profile.postNominals.join(", ")
          : profile.postNominals ?? undefined,
      };
      const pdfVisits = filtered.map((visit) => ({
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
      } else {
        await downloadFullPdf(pdfProfile, pdfVisits, [], {
          dateFrom: from || undefined,
          dateTo: to || undefined,
          includeNotes: true,
        });
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
                disabled={disabled || busy === "full" || busy === "visits"}
              >
                {busy === "visits" ? "Generating…" : "Export Visits"}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => exportPdf("full")}
                disabled={disabled || busy === "full" || busy === "visits"}
              >
                {busy === "full" ? "Generating…" : "Export Full"}
              </button>
            </div>
          </div>

          <p className="subtle text-sm">
            The downloads are created in your browser using the jspdf generator. Ensure pop-ups/downloads are permitted.
          </p>
        </div>
      </div>
    </div>
  );
}