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
  regionName?: string | null;
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

function formatPeriod(period: ReportingPeriod): string {
  if (period.label) return period.label;
  return `${formatDate(period.from)} – ${formatDate(period.to)}`;
}

function formatOfficerLine(officer: OfficerDetails) {
  const postNominalText = officer.postNominals?.length
    ? officer.postNominals.join(" ")
    : undefined;
  const nameParts = [officer.prefix, officer.fullName, postNominalText]
    .filter(Boolean)
    .join(" ");
  return nameParts;
}

function formatLodge(record: GrandOfficerVisitRecord) {
  const number = record.lodgeNumber ? `No. ${record.lodgeNumber}` : null;
  return [record.lodgeName, number].filter(Boolean).join(" ");
}

function normaliseRegion(value?: string | null) {
  if (!value) return "Unspecified region";
  const trimmed = value.trim();
  return trimmed.length ? trimmed : "Unspecified region";
}

export async function downloadGrandOfficerVisitReportPdf(data: GrandOfficerVisitReportData) {
  ensureBrowserEnvironment();
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default as any;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const generatedAt = data.generatedAt || new Date().toISOString();

  const officerLine = formatOfficerLine(data.officer);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Grand Lodge Visits Report", 48, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Officer: ${officerLine}`, 48, 90);
  doc.text(`Office held: ${data.officer.rank ?? "Not specified"}`, 48, 106);
  doc.text(`Term period: ${formatPeriod(data.reportingPeriod)}`, 48, 122);
  doc.text(`Date generated: ${formatDate(generatedAt)}`, 48, 138);

  const officialVisits = data.visits.filter((visit) => visit.isGrandLodgeVisit);
  const totalVisits = officialVisits.length;
  const grandMasterAttendances = officialVisits.filter(
    (visit) => visit.grandMasterInAttendance,
  ).length;

  let cursorY = 178;

  doc.setFont("helvetica", "bold");
  doc.text("Executive summary", 48, cursorY);
  cursorY += 18;

  doc.setFont("helvetica", "normal");
  if (!totalVisits) {
    doc.text("No official Grand Lodge visits were recorded during this reporting period.", 48, cursorY);
    cursorY += 24;
  } else {
    doc.text(`Official Grand Lodge visits supported: ${totalVisits}`, 48, cursorY);
    cursorY += 16;
    doc.text(
      `Grand Master in attendance: ${grandMasterAttendances} visit${grandMasterAttendances === 1 ? "" : "s"}`,
      48,
      cursorY,
    );
    cursorY += 24;
  }

  const regionMap = new Map<
    string,
    Map<
      string,
      {
        lodgeLabel: string;
        count: number;
      }
    >
  >();
  const lodgeSet = new Set<string>();

  for (const visit of officialVisits) {
    const region = normaliseRegion(visit.regionName);
    const lodgeLabel = formatLodge(visit) || "Unspecified lodge";
    const regionBucket = regionMap.get(region) ?? new Map();
    const existing = regionBucket.get(lodgeLabel);
    if (existing) {
      existing.count += 1;
    } else {
      regionBucket.set(lodgeLabel, { lodgeLabel, count: 1 });
    }
    regionMap.set(region, regionBucket);
    lodgeSet.add(lodgeLabel);
  }

  const sortedRegions = Array.from(regionMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { sensitivity: "base" }),
  );

  for (const [regionName, lodges] of sortedRegions) {
    if (cursorY > 700) {
      doc.addPage();
      cursorY = 56;
    }

    doc.setFont("helvetica", "bold");
    doc.text(regionName, 48, cursorY);
    cursorY += 14;

    const rows = Array.from(lodges.values()).sort((a, b) =>
      a.lodgeLabel.localeCompare(b.lodgeLabel, undefined, { sensitivity: "base" }),
    );
    const regionTotal = rows.reduce((sum, row) => sum + row.count, 0);

    const bodyRows = rows.map((row) => [row.lodgeLabel, String(row.count)]);
    bodyRows.push(["Total", String(regionTotal)]);

    autoTable(doc, {
      startY: cursorY,
      head: [["Lodge name and number", "Official visits"]],
      body: bodyRows,
      styles: { fontSize: 10, cellPadding: 6, lineColor: [0, 0, 0], lineWidth: 0.25 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 255, 255] },
    } as any);

    cursorY = (doc as any).lastAutoTable.finalY + 24;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Overall summary", 48, cursorY);
  cursorY += 16;
  doc.setFont("helvetica", "normal");

  const totalRegionsVisited = sortedRegions.length;
  const totalLodgesVisited = lodgeSet.size;

  const summaryLines = [
    `Total regions visited: ${totalRegionsVisited}`,
    `Total lodges visited: ${totalLodgesVisited}`,
    `Total visits recorded: ${totalVisits}`,
  ];

  doc.text(summaryLines, 48, cursorY);

  doc.save("Grand-Lodge-visits-report.pdf");
}
