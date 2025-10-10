const BRAND_BLUE: [number, number, number] = [0, 82, 155];

export type ReportingPeriod = {
  from: string;
  to: string;
  label?: string;
};

export type OfficerDetails = {
  prefix?: string;
  fullName: string;
  postNominals?: string[];
  rank?: string;
};

export type GrandOfficerVisitRecord = {
  date: string;
  lodgeName: string;
  lodgeNumber?: string | null;
  workOfEvening?: string | null;
  candidateName?: string | null;
  comments?: string | null;
  isGrandLodgeVisit?: boolean;
  hasTracingBoards?: boolean;
  grandMasterInAttendance?: boolean;
};

export type GrandOfficerVisitReportData = {
  officer: OfficerDetails;
  reportingPeriod: ReportingPeriod;
  visits: GrandOfficerVisitRecord[];
  generatedAt?: string;
};

function ensureBrowserEnvironment() {
  if (typeof window === "undefined") {
    throw new Error("PDF generation must run in the browser.");
  }
}

function formatDate(value: string | undefined | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTableDate(value: string | undefined | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPeriod(period: ReportingPeriod): string {
  if (period.label) return period.label;
  return `${formatDate(period.from)} – ${formatDate(period.to)}`;
}

const WORK_LABELS: Record<string, string> = {
  INITIATION: "First Degree",
  PASSING: "Second Degree",
  RAISING: "Third Degree",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Other",
};

function formatWork(value: string | null | undefined) {
  if (!value) return "";
  return WORK_LABELS[value] ?? value.replace(/_/g, " ");
}

function formatOfficerLine(officer: OfficerDetails) {
  const postNominalText = officer.postNominals?.length
    ? officer.postNominals.join(" ")
    : undefined;
  const nameParts = [officer.prefix, officer.fullName, postNominalText]
    .filter(Boolean)
    .join(" ");
  return officer.rank ? `${nameParts} ${officer.rank}`.trim() : nameParts;
}

function formatLodge(record: GrandOfficerVisitRecord) {
  const number = record.lodgeNumber ? `No. ${record.lodgeNumber}` : null;
  return [record.lodgeName, number].filter(Boolean).join(" ");
}

function summariseHighlights(record: GrandOfficerVisitRecord) {
  const highlights = [] as string[];
  if (record.candidateName) {
    highlights.push(`Candidate: ${record.candidateName}`);
  }
  if (record.hasTracingBoards) {
    highlights.push("Tracing boards presented");
  }
  if (record.comments) {
    highlights.push(record.comments);
  }
  return highlights.join(" — ");
}

export async function downloadGrandOfficerVisitReportPdf(data: GrandOfficerVisitReportData) {
  ensureBrowserEnvironment();
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default as any;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const generatedAt = data.generatedAt || new Date().toISOString();

  const officerLine = formatOfficerLine(data.officer);
  const title = `End of term report for ${officerLine}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 48, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(formatPeriod(data.reportingPeriod), 48, 76);
  doc.setTextColor(0, 0, 0);
  doc.text(`Generated ${formatDate(generatedAt)}`, 48, 92);

  const totalVisits = data.visits.length;
  const grandLodgeVisits = data.visits.filter((visit) => visit.isGrandLodgeVisit).length;
  const grandMasterAttendances = data.visits.filter((visit) => visit.grandMasterInAttendance).length;

  doc.setFontSize(12);
  doc.text(`Total visits recorded: ${totalVisits}`, 48, 120);
  doc.text(`Grand Lodge visits: ${grandLodgeVisits}`, 48, 138);
  doc.text(`Grand Master present: ${grandMasterAttendances}`, 48, 156);

  if (!totalVisits) {
    doc.setFontSize(11);
    doc.text("No visits were recorded during this reporting period.", 48, 188);
    doc.save("Grand-Lodge-officer-visit-report.pdf");
    return;
  }

  autoTable(doc, {
    startY: 188,
    head: [["Date", "Lodge", "Work", "Grand Lodge", "Grand Master", "Highlights"]],
    body: data.visits.map((visit) => [
      formatTableDate(visit.date),
      formatLodge(visit),
      formatWork(visit.workOfEvening ?? undefined),
      visit.isGrandLodgeVisit ? "Yes" : "No",
      visit.grandMasterInAttendance ? "Yes" : "No",
      summariseHighlights(visit),
    ]),
    styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
    headStyles: { fillColor: BRAND_BLUE },
    alternateRowStyles: { fillColor: [245, 249, 255] },
  } as any);

  doc.save("Grand-Lodge-officer-visit-report.pdf");
}
