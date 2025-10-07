const BRAND_BLUE: [number, number, number] = [0, 82, 155];
const DEFAULT_LOGO_URL = "https://freemasonsnz.org/wp-content/uploads/2019/05/freemason_colour_standardonwhite.png";

export type CandidateCeremonyRecord = {
  date: string; // ISO string
  ceremony: string;
  lodge: string;
  result: string;
  notes?: string;
};

export type CandidateProgressRecord = {
  name: string;
  narrative: string;
  ceremonies: CandidateCeremonyRecord[];
  status?: string;
  initiatedOn?: string;
  passedOn?: string;
  raisedOn?: string;
};

export type EmergencyMeetingRecord = {
  date: string;
  purpose: string;
  candidates: string[];
  notes?: string;
};

export type MeetingOverviewRecord = {
  date: string;
  meetingType: string;
  purpose: string;
  candidates: string[];
  result: string;
  isGrandLodgeVisit?: boolean;
};

export type SummaryMetrics = {
  initiated: number;
  passed: number;
  raised: number;
  totalWorkings: number;
  emergencyMeetings: number;
  grandLodgeVisits: number;
};

export type ReportingPeriod = {
  from: string;
  to: string;
  label?: string;
};

export type LodgeDetails = {
  name: string;
  number: string;
};

export type PreparedBy = {
  prefix?: string;
  fullName: string;
  postNominals?: string | string[];
};

export type GrandSuperintendentReportData = {
  lodge: LodgeDetails;
  regionName: string;
  reportingPeriod: ReportingPeriod;
  preparedBy: PreparedBy;
  preparationDate: string;
  executiveSummary: string;
  summaryMetrics: SummaryMetrics;
  candidates: CandidateProgressRecord[];
  emergencyMeetings: EmergencyMeetingRecord[];
  meetings: MeetingOverviewRecord[];
  hasGrandLodgeVisit: boolean;
  closingStatement?: string;
  logoUrl?: string;
};

function ensureBrowserEnvironment() {
  if (typeof window === "undefined") {
    throw new Error("PDF generation must run in the browser.");
  }
}

function formatLongDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTableDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatReportingPeriod(period: ReportingPeriod): string {
  if (period.label) return period.label;
  return `${formatLongDate(period.from)} – ${formatLongDate(period.to)}`;
}

function formatPreparedBy(preparedBy: PreparedBy): string {
  const postNominals = preparedBy.postNominals;
  const postNominalText = Array.isArray(postNominals)
    ? postNominals.join(" ")
    : (postNominals ?? "");
  return [
    "Worshipful Master",
    [preparedBy.prefix, preparedBy.fullName].filter(Boolean).join(" "),
    postNominalText,
  ]
    .filter(Boolean)
    .join(" ");
}

function computeCandidateMilestones(candidate: CandidateProgressRecord) {
  const { ceremonies } = candidate;
  const lowerCaseMatch = (name: string, target: string) =>
    name.trim().toLowerCase() === target.trim().toLowerCase();

  const findDateFor = (targets: string[]): string | undefined => {
    for (const ceremony of ceremonies) {
      if (targets.some(t => lowerCaseMatch(ceremony.ceremony, t))) {
        return ceremony.date;
      }
    }
    return undefined;
  };

  const initiated = candidate.initiatedOn ?? findDateFor(["Initiation", "Initiated"]);
  const passed = candidate.passedOn ?? findDateFor(["Passing", "Passed"]);
  const raised = candidate.raisedOn ?? findDateFor(["Raising", "Raised"]);

  let status = candidate.status;
  if (!status) {
    if (raised) status = "Completed";
    else if (passed) status = "Awaiting Raising";
    else if (initiated) status = "Awaiting Passing";
    else status = "In Progress";
  }

  return { initiated, passed, raised, status };
}

function surnameSortKey(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return name.toLowerCase();
  const surname = parts[parts.length - 1];
  return `${surname.toLowerCase()}_${name.toLowerCase()}`;
}

async function loadLogoDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(arrayBuffer);
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    const mime = response.headers.get("Content-Type") || "image/png";
    return `data:${mime};base64,${base64}`;
  } catch (error) {
    console.warn("Unable to load Freemasons NZ logo", error);
    return null;
  }
}

type SectionHelpers = {
  doc: any;
  margin: number;
  pageWidth: number;
  pageHeight: number;
  currentY: number;
};

function addSectionTitle({ doc, margin }: SectionHelpers, title: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(title, margin, doc.__currentY);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.__currentY += 24;
}

function addParagraph({ doc, margin, pageWidth }: SectionHelpers, text: string, extraSpacing = 12) {
  if (!text) return;
  const availableWidth = pageWidth - margin * 2;
  const lines = doc.splitTextToSize(text, availableWidth);
  const lineHeight = 14;
  doc.text(lines, margin, doc.__currentY);
  doc.__currentY += lines.length * lineHeight + extraSpacing;
}

function ensureSectionSpacing({ doc, margin, pageHeight }: SectionHelpers, minSpace: number) {
  if (doc.__currentY + minSpace > pageHeight - margin) {
    doc.addPage();
    doc.__currentY = margin;
  }
}

function addAutoTable(section: SectionHelpers, options: Record<string, unknown>) {
  const { doc, margin } = section;
  const autoTable = doc.__autoTable;
  const startY = options.startY as number | undefined;
  const resolvedStartY = startY && startY > doc.__currentY ? startY : doc.__currentY;

  autoTable(doc, {
    styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
    headStyles: { fillColor: BRAND_BLUE, textColor: 255, lineWidth: 0 },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    margin: { left: margin, right: margin, top: 40, bottom: 40 },
    ...options,
    startY: resolvedStartY,
  });

  const lastTable = doc.lastAutoTable;
  if (lastTable) {
    doc.__currentY = lastTable.finalY + 16;
  }
}

function formatCandidatesList(list: string[]): string {
  return list.join(", ");
}

function defaultClosingStatement(lodge: LodgeDetails): string {
  return `${lodge.name} No. ${lodge.number} continues to show commitment to Masonic work and candidate progression throughout the year. The Worshipful Master extends thanks to the Grand Superintendent for his ongoing guidance and support.`;
}

export async function generateGrandSuperintendentReportPdf(data: GrandSuperintendentReportData) {
  ensureBrowserEnvironment();
  const { jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = (autoTableModule.default || autoTableModule) as any;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const docAny = doc as any;
  const margin = 56.7; // 2cm
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  docAny.__autoTable = autoTable;
  docAny.__currentY = margin;

  const logoDataUrl = await loadLogoDataUrl(data.logoUrl || DEFAULT_LOGO_URL);

  // Cover page
  doc.setFont("helvetica", "normal");
  if (logoDataUrl) {
    const logoWidth = 90; // approx 120px at 72dpi
    const logoHeight = 90 * 0.63; // approximate aspect ratio safeguard
    doc.addImage(logoDataUrl, "PNG", pageWidth - margin - logoWidth, margin, logoWidth, logoHeight);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Grand Superintendent of Region Report", margin, margin + 100);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(`Prepared for the Grand Superintendent of ${data.regionName}`, margin, margin + 140);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(12);
  doc.text(`Reporting Period: ${formatReportingPeriod(data.reportingPeriod)}`, margin, margin + 180);
  doc.text(`Lodge: ${data.lodge.name} No. ${data.lodge.number}`, margin, margin + 204);
  doc.text(`Prepared by: ${formatPreparedBy(data.preparedBy)}`, margin, margin + 228);
  doc.text(`Date of Preparation: ${formatLongDate(data.preparationDate)}`, margin, margin + 252);

  doc.addPage();
  docAny.__currentY = margin;

  const section: SectionHelpers = {
    doc: docAny,
    margin,
    pageWidth,
    pageHeight,
    currentY: margin,
  } as any;

  // Section 2: Executive Summary
  addSectionTitle(section, "Executive Summary");
  addParagraph(section, data.executiveSummary);

  addAutoTable(section, {
    head: [["Metric", "Count"]],
    body: [
      ["Candidates initiated", data.summaryMetrics.initiated],
      ["Candidates passed", data.summaryMetrics.passed],
      ["Candidates raised", data.summaryMetrics.raised],
      ["Total workings held", data.summaryMetrics.totalWorkings],
      ["Emergency meetings", data.summaryMetrics.emergencyMeetings],
      ["Grand Lodge visits", data.summaryMetrics.grandLodgeVisits],
    ],
  });

  // Section 3: Candidate Progress
  ensureSectionSpacing(section, 80);
  addSectionTitle(section, "Candidate Progress");

  const sortedCandidates = [...data.candidates].sort((a, b) => {
    const keyA = surnameSortKey(a.name);
    const keyB = surnameSortKey(b.name);
    return keyA.localeCompare(keyB);
  });

  for (const candidate of sortedCandidates) {
    ensureSectionSpacing(section, 100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(candidate.name, margin, docAny.__currentY);
    docAny.__currentY += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    addParagraph(section, candidate.narrative, 10);

    const ceremonyRows = candidate.ceremonies.map(ceremony => [
      formatTableDate(ceremony.date),
      ceremony.ceremony,
      ceremony.lodge,
      ceremony.result,
      ceremony.notes ?? "",
    ]);

    addAutoTable(section, {
      head: [["Date", "Ceremony", "Lodge", "Result", "Notes"]],
      body: ceremonyRows,
    });
  }

  // Section 4: Emergency Meetings
  ensureSectionSpacing(section, 80);
  addSectionTitle(section, "Emergency Meetings");
  if (!data.emergencyMeetings.length) {
    addParagraph(section, "No emergency meetings were held during this period.");
  } else {
    const emergencyRows = data.emergencyMeetings.map(meeting => [
      formatTableDate(meeting.date),
      meeting.purpose,
      formatCandidatesList(meeting.candidates),
      meeting.notes ?? "",
    ]);

    addAutoTable(section, {
      head: [["Date", "Purpose", "Candidate(s)", "Notes"]],
      body: emergencyRows,
    });
  }

  // Section 5: Grand Lodge and Regional Visits
  ensureSectionSpacing(section, 60);
  addSectionTitle(section, "Grand Lodge and Regional Visits");
  const visitText = data.hasGrandLodgeVisit
    ? "One or more meetings during this period were Grand Lodge Visits."
    : "No Grand Lodge Visits were recorded during this period.";
  addParagraph(section, visitText);

  // Section 6: Summary Tables
  ensureSectionSpacing(section, 80);
  addSectionTitle(section, "Summary Tables");

  const candidateOverviewRows = sortedCandidates.map(candidate => {
    const milestones = computeCandidateMilestones(candidate);
    return [
      candidate.name,
      milestones.initiated ? formatTableDate(milestones.initiated) : "—",
      milestones.passed ? formatTableDate(milestones.passed) : "—",
      milestones.raised ? formatTableDate(milestones.raised) : "—",
      milestones.status,
    ];
  });

  addAutoTable(section, {
    head: [["Candidate", "Initiated", "Passed", "Raised", "Status"]],
    body: candidateOverviewRows,
  });

  ensureSectionSpacing(section, 40);
  addAutoTable(section, {
    head: [["Date", "Meeting Type", "Ceremony / Purpose", "Candidate(s)", "Result"]],
    body: data.meetings.map(meeting => [
      formatTableDate(meeting.date),
      meeting.meetingType,
      meeting.purpose,
      formatCandidatesList(meeting.candidates),
      meeting.result,
    ]),
  });

  // Section 7: Closing Statement
  ensureSectionSpacing(section, 80);
  addSectionTitle(section, "Closing Statement");
  const closing = data.closingStatement ?? defaultClosingStatement(data.lodge);
  addParagraph(section, closing, 20);

    const signatureY = docAny.__currentY;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Signed:  ${formatPreparedBy(data.preparedBy)}`, margin, signatureY);
  doc.text(`Lodge ${data.lodge.name} No. ${data.lodge.number}`, margin, signatureY + 18);
  doc.text(`Date: ${formatLongDate(data.preparationDate)}`, margin, signatureY + 36);

  // Header and footer
  const pageCount = doc.getNumberOfPages();
  const reportingPeriodLabel = formatReportingPeriod(data.reportingPeriod);
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber);

    // Header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_BLUE);
    doc.text(`${data.lodge.name} No. ${data.lodge.number}`, margin, margin - 24);
    doc.setTextColor(0, 0, 0);

    // Footer
    doc.setFontSize(9);
    const footerText = `Page ${pageNumber} of ${pageCount} | ${reportingPeriodLabel}`;
    doc.text(footerText, pageWidth - margin, pageHeight - margin + 24, { align: "right" });
  }

  return doc;
}

export async function downloadGrandSuperintendentReportPdf(data: GrandSuperintendentReportData) {
  const doc = await generateGrandSuperintendentReportPdf(data);
  const from = data.reportingPeriod.from.slice(0, 10);
  const to = data.reportingPeriod.to.slice(0, 10);
  const fileName = `GSR_Report_${data.lodge.number}_${from}_to_${to}.pdf`;
  doc.save(fileName);
}

