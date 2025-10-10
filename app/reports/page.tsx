'use client';

import { useEffect, useMemo, useState } from "react";

import { deriveTitle } from "@/lib/constants";

import {
  downloadGrandSuperintendentReportPdf,
  type CandidateCeremonyRecord,
  type CandidateProgressRecord,
  type EmergencyMeetingRecord,
  type GrandSuperintendentReportData,
  type MeetingOverviewRecord,
  type SummaryMetrics,
} from "@/src/utils/gsrReportPdf";
import { downloadGrandOfficerVisitReportPdf } from "@/src/utils/grandOfficerVisitReportPdf";

type VisitRecord = {
  id?: string;
  date: string;
  lodgeName: string;
  lodgeNumber?: string | null;
  regionName?: string | null;
  workOfEvening: string;
  candidateName?: string | null;
  comments?: string | null;
  isGrandLodgeVisit?: boolean;
  hasTracingBoards?: boolean;
  grandMasterInAttendance?: boolean;
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
  region?: string | null;
  rank?: string | null;
  isPastGrand?: boolean;
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

const CEREMONY_LABELS: Record<string, string> = {
  INITIATION: "Initiation",
  PASSING: "Passing",
  RAISING: "Raising",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Working",
};

function formatWork(work: string | undefined | null) {
  if (!work) return "";
  return WORK_LABELS[work] ?? work.replace(/_/g, " ");
}

function normaliseWork(value: string | undefined | null) {
  if (!value) return "OTHER";
  const trimmed = value.trim().toUpperCase();
  return CEREMONY_LABELS[trimmed] ? trimmed : trimmed || "OTHER";
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinPeriod(iso: string, start: Date, end: Date) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function splitCandidates(name?: string | null) {
  if (!name) return [] as string[];
  return name
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function pluralise(value: number, singular: string, plural?: string) {
  const resolvedPlural = plural ?? `${singular}s`;
  return `${value} ${value === 1 ? singular : resolvedPlural}`;
}

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [workings, setWorkings] = useState<WorkingRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"grandSuperintendent" | "grandOfficer">(
    "grandSuperintendent",
  );

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
        setProfile({
          ...profileJson,
          rank: typeof profileJson.rank === "string" ? profileJson.rank : null,
          isPastGrand: Boolean(profileJson.isPastGrand),
          postNominals: Array.isArray(profileJson.postNominals)
            ? profileJson.postNominals
            : profileJson.postNominals
            ? [profileJson.postNominals]
            : [],
        });

        const visitJson = await visitsRes.json();
        setVisits(
          (Array.isArray(visitJson) ? visitJson : []).map((row: any) => ({
            id: row.id,
            date: row.date ?? row.dateISO ?? "",
            lodgeName: row.lodgeName ?? "",
            lodgeNumber: row.lodgeNumber ?? null,
            regionName: row.regionName ?? row.region ?? null,
            workOfEvening: row.workOfEvening ?? row.eventType ?? "OTHER",
            candidateName: row.candidateName ?? null,
            comments: row.comments ?? row.notes ?? null,
            isGrandLodgeVisit: Boolean(row.isGrandLodgeVisit),
            hasTracingBoards: Boolean(row.hasTracingBoards),
            grandMasterInAttendance: Boolean(row.grandMasterInAttendance),
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

  useEffect(() => {
    if (!profile?.rank || profile.rank === "Worshipful Master") return;
    setReportType((previous) => (previous === "grandOfficer" ? previous : "grandOfficer"));
  }, [profile?.rank]);

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

  const filteredWorkings = useMemo(() => {
    if (!workings.length) return [] as WorkingRecord[];
    const fromTime = from ? new Date(from).getTime() : null;
    const toTime = to ? new Date(to).getTime() : null;
    return workings.filter((working) => {
      const workingTime = new Date(working.date).getTime();
      if (Number.isNaN(workingTime)) return true;
      if (fromTime && workingTime < fromTime) return false;
      if (toTime && workingTime > toTime) return false;
      return true;
    });
  }, [workings, from, to]);

  async function generateReport(mode: "term" | "custom") {
    if (!profile) {
      setError("Profile details are still loading.");
      return;
    }

    const isGrandOfficerReport = reportType === "grandOfficer";
    const canUseGrandSuperintendent = profile.rank === "Worshipful Master";

    if (!isGrandOfficerReport && !canUseGrandSuperintendent) {
      setError("Set your rank to Worshipful Master in your profile to generate this report.");
      return;
    }

    if (!profile.name) {
      setError("Add your full name in your profile to generate this report.");
      return;
    }

    if (!isGrandOfficerReport) {
      if (!profile.lodgeName || !profile.lodgeNumber) {
        setError("Add your lodge name and number in your profile to generate this report.");
        return;
      }

      if (!profile.region) {
        setError("Add your region in your profile to generate this report.");
        return;
      }
    }

    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;
    let periodLabel: string | undefined;

    if (mode === "custom") {
      if (!from || !to) {
        setError("Select both a start and end date for a custom report.");
        return;
      }
      periodStart = parseDate(from);
      periodEnd = parseDate(to);
      if (!periodStart || !periodEnd) {
        setError("Enter valid dates for the custom range.");
        return;
      }
      if (periodEnd.getTime() < periodStart.getTime()) {
        setError("The end date must be on or after the start date.");
        return;
      }
    } else {
      periodStart = parseDate(profile.termStart);
      periodEnd = parseDate(profile.termEnd);
      if (!periodStart || !periodEnd) {
        setError("Set your current term start and end dates in your profile to generate this report.");
        return;
      }
      periodLabel = `Current term (${periodStart.toLocaleDateString()} – ${periodEnd.toLocaleDateString()})`;
    }

    if (!periodStart || !periodEnd) {
      setError("Unable to resolve the reporting period.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const resolvedStart = periodStart as Date;
      const resolvedEnd = periodEnd as Date;

      const visitsInPeriod = visits.filter((visit) =>
        isWithinPeriod(visit.date, resolvedStart, resolvedEnd),
      );
      const orderedVisits = [...visitsInPeriod].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      if (isGrandOfficerReport) {
        const derivedTitles = deriveTitle(profile.rank ?? "Master Mason", Boolean(profile.isPastGrand));
        const existingPostNominals = Array.isArray(profile.postNominals)
          ? profile.postNominals
          : [];
        const officerPostNominals = existingPostNominals.length
          ? existingPostNominals
          : derivedTitles.postNominals ?? [];
        const officerPrefix = profile.prefix ?? derivedTitles.prefix;

        await downloadGrandOfficerVisitReportPdf({
          officer: {
            prefix: officerPrefix,
            fullName: profile.name ?? "",
            postNominals: officerPostNominals,
            rank: profile.rank ?? undefined,
          },
          reportingPeriod: {
            from: resolvedStart.toISOString(),
            to: resolvedEnd.toISOString(),
            label: periodLabel,
          },
          visits: orderedVisits.map((visit) => ({
            date: visit.date,
            lodgeName: visit.lodgeName,
            lodgeNumber: visit.lodgeNumber,
            regionName: visit.regionName ?? profile.region ?? null,
            workOfEvening: visit.workOfEvening,
            candidateName: visit.candidateName,
            comments: visit.comments,
            isGrandLodgeVisit: Boolean(visit.isGrandLodgeVisit),
            hasTracingBoards: Boolean(visit.hasTracingBoards),
            grandMasterInAttendance: Boolean(visit.grandMasterInAttendance),
          })),
          generatedAt: new Date().toISOString(),
        });
        return;
      }

      const workingsInPeriod = workings.filter((working) =>
        isWithinPeriod(working.date, resolvedStart, resolvedEnd),
      );

      const lodgeDisplay = [profile.lodgeName, profile.lodgeNumber ? `No. ${profile.lodgeNumber}` : null]
        .filter(Boolean)
        .join(" ");

      const summaryMetrics: SummaryMetrics = {
        initiated: 0,
        passed: 0,
        raised: 0,
        totalWorkings: workingsInPeriod.length,
        emergencyMeetings: 0,
        grandLodgeVisits: 0,
      };

      const candidateEvents = new Map<string, CandidateCeremonyRecord[]>();
      const candidateMilestones = new Map<
        string,
        { initiatedOn?: string; passedOn?: string; raisedOn?: string }
      >();

      const meetingSummaries: MeetingOverviewRecord[] = [];
      const emergencyMeetings: EmergencyMeetingRecord[] = [];

      for (const working of workingsInPeriod) {
        const workCode = normaliseWork(working.work);
        if (workCode === "INITIATION") summaryMetrics.initiated += 1;
        if (workCode === "PASSING") summaryMetrics.passed += 1;
        if (workCode === "RAISING") summaryMetrics.raised += 1;
        if (working.isEmergencyMeeting) summaryMetrics.emergencyMeetings += 1;
        if (working.isGrandLodgeVisit) summaryMetrics.grandLodgeVisits += 1;

        const candidates = splitCandidates(working.candidateName);
        const ceremonyLabel = CEREMONY_LABELS[workCode] ?? formatWork(workCode);
        const baseNotes = [working.comments?.trim() || null];
        if (working.hasTracingBoards) {
          baseNotes.push("Tracing boards presented");
        }
        const notes = baseNotes.filter(Boolean).join(" — ") || undefined;
        const ceremonyRecord: CandidateCeremonyRecord = {
          date: working.date,
          ceremony: ceremonyLabel,
          lodge: lodgeDisplay,
          result: working.isGrandLodgeVisit ? "Grand Lodge visit" : "Recorded",
          notes,
        };

        if (candidates.length) {
          for (const candidateName of candidates) {
            const existing = candidateEvents.get(candidateName) ?? [];
            existing.push(ceremonyRecord);
            candidateEvents.set(candidateName, existing);

            const milestones = candidateMilestones.get(candidateName) ?? {};
            if (workCode === "INITIATION" && !milestones.initiatedOn) milestones.initiatedOn = working.date;
            if (workCode === "PASSING" && !milestones.passedOn) milestones.passedOn = working.date;
            if (workCode === "RAISING" && !milestones.raisedOn) milestones.raisedOn = working.date;
            candidateMilestones.set(candidateName, milestones);
          }
        }

        meetingSummaries.push({
          date: working.date,
          meetingType: working.isEmergencyMeeting ? "Emergency Meeting" : "Stated Meeting",
          purpose: formatWork(workCode),
          candidates,
          result: working.comments?.trim() || (working.isGrandLodgeVisit ? "Grand Lodge visit" : "Completed"),
          isGrandLodgeVisit: working.isGrandLodgeVisit,
        });

        if (working.isEmergencyMeeting) {
          emergencyMeetings.push({
            date: working.date,
            purpose: ceremonyLabel,
            candidates,
            notes: working.comments?.trim() || undefined,
          });
        }
      }

      const visitsGrandLodgeCount = orderedVisits.filter((visit) => visit.isGrandLodgeVisit).length;
      summaryMetrics.grandLodgeVisits += visitsGrandLodgeCount;

      const candidateRecords: CandidateProgressRecord[] = Array.from(candidateEvents.entries()).map(
        ([name, ceremonies]) => {
          const orderedCeremonies = [...ceremonies].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
          const milestones = candidateMilestones.get(name) ?? {};
          const latest = orderedCeremonies[orderedCeremonies.length - 1];
          const ceremonySummary = orderedCeremonies
            .map((ceremony) => `${ceremony.ceremony} on ${new Date(ceremony.date).toLocaleDateString()}`)
            .join("; ");
          const narrative = ceremonySummary
            ? `${name} progressed through ${ceremonySummary}.`
            : `${name} has no recorded ceremonies during this period.`;
          return {
            name,
            narrative,
            ceremonies: orderedCeremonies,
            status: latest?.ceremony,
            initiatedOn: milestones.initiatedOn,
            passedOn: milestones.passedOn,
            raisedOn: milestones.raisedOn,
          } satisfies CandidateProgressRecord;
        },
      );

      if (!candidateRecords.length) {
        candidateRecords.push({
          name: "No recorded candidates",
          narrative: "No candidate progression events were recorded during this period.",
          ceremonies: [
            {
              date: resolvedStart.toISOString(),
              ceremony: "No ceremonies recorded",
              lodge: lodgeDisplay,
              result: "No records in the reporting period",
            },
          ],
        });
      }

      if (!emergencyMeetings.length) {
        summaryMetrics.emergencyMeetings = 0;
      }

      const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: "long" });
      const summaryParts = [
        `${lodgeDisplay} recorded ${pluralise(
          summaryMetrics.totalWorkings,
          "working",
        )} between ${formatter.format(resolvedStart)} and ${formatter.format(resolvedEnd)}.`,
        `The lodge hosted ${pluralise(summaryMetrics.initiated, "initiation")}, ${pluralise(
          summaryMetrics.passed,
          "passing",
        )}, and ${pluralise(summaryMetrics.raised, "raising")}.`,
        `Emergency meetings: ${summaryMetrics.emergencyMeetings}. Grand Lodge visits: ${summaryMetrics.grandLodgeVisits}.`,
      ];

      const reportData: GrandSuperintendentReportData = {
        lodge: {
          name: profile.lodgeName ?? "",
          number: profile.lodgeNumber ?? "",
        },
        regionName: profile.region ?? "",
        reportingPeriod: {
          from: resolvedStart.toISOString(),
          to: resolvedEnd.toISOString(),
          label: periodLabel,
        },
        preparedBy: {
          prefix: profile.prefix ?? undefined,
          fullName: profile.name ?? "",
          postNominals: profile.postNominals ?? [],
        },
        preparationDate: new Date().toISOString(),
        executiveSummary: summaryParts.join(" "),
        summaryMetrics,
        candidates: candidateRecords,
        emergencyMeetings,
        meetings: meetingSummaries.length
          ? meetingSummaries
          : [
              {
                date: resolvedStart.toISOString(),
                meetingType: "Stated Meeting",
                purpose: "No workings recorded",
                candidates: [],
                result: "No meetings recorded during this period.",
              },
            ],
        hasGrandLodgeVisit: summaryMetrics.grandLodgeVisits > 0,
      };

      await downloadGrandSuperintendentReportPdf(reportData);
    } catch (err: any) {
      console.error("GSR_PDF_ERROR", err);
      setError(err?.message || "Unable to generate the PDF report.");
    } finally {
      setBusy(false);
    }
  }

  const canUseGrandSuperintendent = profile?.rank === "Worshipful Master";
  const visitSummary = filteredVisits.length;
  const workingSummary = filteredWorkings.length;
  const grandLodgeSummary = filteredVisits.filter((visit) => visit.isGrandLodgeVisit).length;
  const grandMasterSummary = filteredVisits.filter((visit) => visit.grandMasterInAttendance).length;
  const termReady = Boolean(profile?.termStart && profile?.termEnd);
  const highlightSummaryLabel =
    reportType === "grandSuperintendent" ? "Total lodge workings" : "Grand Master attendances";
  const highlightSummaryValue =
    reportType === "grandSuperintendent" ? workingSummary : grandMasterSummary;

  const reportOptions: { id: "grandSuperintendent" | "grandOfficer"; label: string; description: string; disabled: boolean }[] = [
    {
      id: "grandSuperintendent",
      label: "Worshipful Master term report",
      description: "Detailed candidate and meeting summary for your lodge.",
      disabled: !canUseGrandSuperintendent,
    },
    {
      id: "grandOfficer",
      label: "Grand Lodge officer visit report",
      description: "Visit-focused export tailored to Grand Lodge officers.",
      disabled: false,
    },
  ];

  const termButtonDisabled =
    busy || !profile || (reportType === "grandSuperintendent" && !canUseGrandSuperintendent);
  const customButtonDisabled =
    busy || !from || !to || (reportType === "grandSuperintendent" && !canUseGrandSuperintendent);

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
          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Report type</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {reportOptions.map((option) => {
                const isSelected = reportType === option.id;
                const baseClasses = isSelected
                  ? "border-blue-500 bg-blue-50 text-slate-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-800 hover:border-slate-300";
                const disabledClasses = option.disabled ? "cursor-not-allowed opacity-60" : "";
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (option.disabled) return;
                      setReportType(option.id);
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${baseClasses} ${disabledClasses}`}
                  >
                    <span className="block font-semibold">{option.label}</span>
                    <span className="mt-1 block text-sm text-slate-600">{option.description}</span>
                  </button>
                );
              })}
            </div>
            {reportType === "grandSuperintendent" && !canUseGrandSuperintendent ? (
              <p className="text-xs text-red-600">
                Set your rank to Worshipful Master in your profile to enable this report.
              </p>
            ) : null}
          </div>

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
                disabled={termButtonDisabled}
              >
                {busy ? 'Working…' : 'Generate for current term'}
              </button>
              <button
                className="btn-primary w-full sm:w-auto"
                onClick={() => generateReport("custom")}
                disabled={customButtonDisabled}
              >
                {busy ? 'Working…' : 'Generate custom period'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="subtle">Visits in range</div>
              <div className="text-lg font-semibold">{visitSummary}</div>
            </div>
            <div>
              <div className="subtle">Grand Lodge visits</div>
              <div className="text-lg font-semibold">{grandLodgeSummary}</div>
            </div>
            <div>
              <div className="subtle">{highlightSummaryLabel}</div>
              <div className="text-lg font-semibold">{highlightSummaryValue}</div>
            </div>
            <div>
              <div className="subtle">Term configured</div>
              <div className="text-lg font-semibold">{termReady ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && reportType === "grandSuperintendent" && !visits.length && !workings.length && (
            <p className="text-sm text-slate-500">Add lodge visits and workings to unlock the Grand Superintendent report.</p>
          )}
          {!error && reportType === "grandOfficer" && !visits.length && (
            <p className="text-sm text-slate-500">Add visits to unlock the Grand Lodge officer report.</p>
          )}
        </div>
      </div>
    </div>
  );
}