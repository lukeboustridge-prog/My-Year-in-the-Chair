// Dynamic-import PDF helpers (SSR-safe) for Next.js App Router

export type Visit = {
  dateISO: string;
  lodgeName: string;
  eventType: string;
  role?: string;
  notes?: string;
};

export type Office = {
  lodgeName: string;
  office: string;
  startDateISO: string;
  endDateISO?: string;
  isGrandLodge?: boolean;
};

export type Profile = {
  prefix?: string;
  fullName: string;
  postNominals?: string;
};

export type ReportOptions = {
  title?: string;
  dateFrom?: string;
  dateTo?: string;
  includeNotes?: boolean;
  includeOffices?: boolean;
  includeVisits?: boolean;
};

export type LodgeWork = {
  dateISO: string;
  work: string;
  candidateName?: string | null;
  lecture?: string | null;
  notes?: string | null;
  grandLodgeVisit?: boolean | null;
  emergencyMeeting?: boolean | null;
};

export type GrandSuperintendentProfile = Profile & {
  lodgeName?: string;
  lodgeNumber?: string;
  region?: string;
};

export type GsrOptions = {
  dateFrom?: string;
  dateTo?: string;
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

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatLongDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPeriod(from?: string, to?: string) {
  const fromLabel = from ? formatLongDate(from) : "";
  const toLabel = to ? formatLongDate(to) : "";
  if (fromLabel && toLabel) return `${fromLabel} – ${toLabel}`;
  if (fromLabel) return `${fromLabel} onwards`;
  if (toLabel) return `Up to ${toLabel}`;
  return "Full reporting period";
}

function plural(count: number, singular: string, pluralForm?: string) {
  const noun = count === 1 ? singular : pluralForm ?? `${singular}s`;
  return `${count} ${noun}`;
}

function getNameLine(profile: GrandSuperintendentProfile) {
  const parts = [profile.prefix, profile.fullName, profile.postNominals]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
  return parts.join(" ");
}

function getLodgeLine(profile: GrandSuperintendentProfile) {
  const name = typeof profile.lodgeName === "string" ? profile.lodgeName.trim() : "";
  const number = typeof profile.lodgeNumber === "string" ? profile.lodgeNumber.trim() : "";
  if (name && number) return `${name} No. ${number}`;
  if (name) return name;
  if (number) return `Lodge No. ${number}`;
  return "";
}

async function loadImageAsDataUrl(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => reject(new Error("Failed to load image"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function ensureSpace(doc: any, cursor: { y: number }, margin: number, required: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (cursor.y + required > pageHeight - margin) {
    doc.addPage();
    cursor.y = margin;
  }
}

function listDates(dates: string[]) {
  if (dates.length === 0) return "";
  if (dates.length === 1) return dates[0];
  return `${dates.slice(0, -1).join(", ")} and ${dates[dates.length - 1]}`;
}

function determineResult(dateISO?: string) {
  if (!dateISO) return "Scheduled";
  const date = new Date(dateISO);
  if (isNaN(date.getTime())) return "Scheduled";
  const now = new Date();
  return date <= now ? "Completed" : "Scheduled";
}

function safeFileSegment(input: string, fallback: string) {
  const trimmed = input.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/[^0-9A-Za-z-]+/g, "");
}

export async function generateMyYearPdf(
  profile: Profile,
  visits: Visit[],
  offices: Office[],
  opts: ReportOptions = {}
) {
  if (typeof window === "undefined") {
    throw new Error("PDF generation must run in the browser.");
  }
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default as any;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const title = opts.title || "My Year in the Chair – Report";

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 40, 40);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const nameLine = [profile.prefix, profile.fullName, profile.postNominals].filter(Boolean).join(" ");
  doc.text(nameLine, 40, 60);
  const generated = new Date().toLocaleString();
  doc.text(`Generated: ${generated}`, 40, 76);

  // Summary
  const totalVisits = visits.length;
  const currentOffices = offices.filter(o => !o.endDateISO);
  const pageYStart = 100;
  doc.setFontSize(11);
  doc.text(`Total visits: ${totalVisits}`, 40, pageYStart);
  doc.text(`Current offices: ${currentOffices.length}`, 200, pageYStart);

  // Visits table
  if (opts.includeVisits !== false && visits.length) {
    autoTable(doc, {
      startY: pageYStart + 20,
      head: [["Date", "Lodge", "Event", "Role"].concat(opts.includeNotes ? ["Notes"] : [])],
      body: visits.map(v =>
        [formatDate(v.dateISO), v.lodgeName, v.eventType, v.role || ""].concat(
          opts.includeNotes ? [v.notes || ""] : []
        )
      ),
      styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: [15, 76, 129] },
      theme: "striped",
      didDrawPage: () => {
        const str = `Page ${doc.getCurrentPageInfo().pageNumber}`;
        doc.setFontSize(9);
        doc.text(str, doc.internal.pageSize.getWidth() - 60, doc.internal.pageSize.getHeight() - 20);
      }
    } as any);
  }

  // Offices table
  if (opts.includeOffices !== false && offices.length) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : pageYStart + 20,
      head: [["Lodge", "Office", "Start", "End", "Type"]],
      body: offices.map(o => [
        o.lodgeName,
        o.office,
        formatDate(o.startDateISO),
        o.endDateISO ? formatDate(o.endDateISO) : "Current",
        o.isGrandLodge ? "Grand Lodge" : "Craft Lodge"
      ]),
      styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: [15, 76, 129] },
      theme: "striped",
    } as any);
  }

  return doc;
}

export async function downloadVisitsPdf(profile: Profile, visits: Visit[], opts?: ReportOptions) {
  const doc = await generateMyYearPdf(profile, visits, [], { ...opts, includeOffices: false, includeVisits: true });
  doc.save("My-Year-in-the-Chair_Visits.pdf");
}

export async function downloadFullPdf(profile: Profile, visits: Visit[], offices: Office[], opts?: ReportOptions) {
  const doc = await generateMyYearPdf(profile, visits, offices, { includeVisits: true, includeOffices: true, ...opts });
  doc.save("My-Year-in-the-Chair_Full-Report.pdf");
}

export async function downloadGsrReport(
  profile: GrandSuperintendentProfile,
  workings: LodgeWork[],
  opts: GsrOptions = {},
) {
  if (typeof window === "undefined") {
    throw new Error("PDF generation must run in the browser.");
  }

  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default as any;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  const cursor = { y: margin };
  const pageWidth = doc.internal.pageSize.getWidth();
  const workingList = [...workings].sort((a, b) => {
    const aDate = a.dateISO || "";
    const bDate = b.dateISO || "";
    if (aDate === bDate) return 0;
    return aDate < bDate ? -1 : 1;
  });

  const derivedFrom = opts.dateFrom || workingList[0]?.dateISO || "";
  const derivedTo = opts.dateTo || workingList[workingList.length - 1]?.dateISO || "";
  const periodLabel = formatPeriod(derivedFrom, derivedTo);

  const totals = {
    initiations: workingList.filter((item) => item.work === "INITIATION").length,
    passings: workingList.filter((item) => item.work === "PASSING").length,
    raisings: workingList.filter((item) => item.work === "RAISING").length,
    totalWorkings: workingList.length,
    emergencyMeetings: workingList.filter((item) => item.emergencyMeeting).length,
    grandLodgeVisits: workingList.filter((item) => item.grandLodgeVisit).length,
  };

  const nameLine = getNameLine(profile) || profile.fullName;
  const lodgeLine = getLodgeLine(profile);
  const lodgeDisplay = lodgeLine || "the Lodge";
  const preparedISO = new Date().toISOString().slice(0, 10);
  const preparedDate = formatLongDate(preparedISO);

  const LOGO_URL = "https://freemasonsnz.org/wp-content/uploads/2019/05/freemason_colour_standardonwhite.png";
  const logoDataUrl = await loadImageAsDataUrl(LOGO_URL);
  if (logoDataUrl) {
    const logoWidth = 140;
    const logoHeight = 70;
    doc.addImage(logoDataUrl, "PNG", pageWidth - margin - logoWidth, margin - 10, logoWidth, logoHeight, undefined, "FAST");
  }

  cursor.y = margin + 100;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("Grand Superintendent of Region Report", margin, cursor.y);
  cursor.y += 34;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  const regionText = profile.region ? profile.region : "the Region";
  doc.text(`Prepared for the Grand Superintendent of ${regionText}`, margin, cursor.y);
  cursor.y += 26;

  doc.setFontSize(12);
  doc.text(`Reporting period: ${periodLabel}`, margin, cursor.y);
  cursor.y += 20;
  doc.text(`Lodge: ${lodgeLine || "—"}`, margin, cursor.y);
  cursor.y += 20;
  doc.text(`Prepared by: Worshipful Master ${nameLine}`, margin, cursor.y);
  cursor.y += 20;
  doc.text(`Date of preparation: ${preparedDate}`, margin, cursor.y);

  doc.addPage();
  cursor.y = margin;

  const contentWidth = pageWidth - margin * 2;
  const summaryParagraph = `${lodgeDisplay} conducted ${plural(totals.totalWorkings, "working")} during ${periodLabel}. The programme comprised ${plural(totals.initiations, "initiation")}, ${plural(totals.passings, "passing")}, and ${plural(totals.raisings, "raising")}, alongside ${plural(totals.emergencyMeetings, "emergency meeting")} and ${plural(totals.grandLodgeVisits, "Grand Lodge visit", "Grand Lodge visits")}.`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Executive Summary", margin, cursor.y);
  cursor.y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const summaryLines = doc.splitTextToSize(summaryParagraph, contentWidth);
  doc.text(summaryLines, margin, cursor.y);
  cursor.y += summaryLines.length * 14 + 10;

  autoTable(doc, {
    startY: cursor.y,
    head: [["Category", "Total"]],
    body: [
      ["Initiations", String(totals.initiations)],
      ["Passings", String(totals.passings)],
      ["Raisings", String(totals.raisings)],
      ["Total workings", String(totals.totalWorkings)],
      ["Emergency meetings", String(totals.emergencyMeetings)],
      ["Grand Lodge visits", String(totals.grandLodgeVisits)],
    ],
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: { fontSize: 10, cellPadding: 6, textColor: 0, lineColor: [0, 0, 0] },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, lineColor: [0, 0, 0] },
  } as any);
  cursor.y = ((doc as any).lastAutoTable?.finalY ?? cursor.y) + 24;

  ensureSpace(doc, cursor, margin, 80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Candidate Progress", margin, cursor.y);
  cursor.y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const candidateMap = new Map<string, LodgeWork[]>();
  for (const working of workingList) {
    const name = (working.candidateName ?? "").trim();
    if (!name) continue;
    const existing = candidateMap.get(name) ?? [];
    existing.push(working);
    candidateMap.set(name, existing);
  }

  const candidateEntries = Array.from(candidateMap.entries()).sort((a, b) => {
    const [nameA] = a;
    const [nameB] = b;
    const surnameA = nameA.trim().split(/\s+/).pop() ?? nameA;
    const surnameB = nameB.trim().split(/\s+/).pop() ?? nameB;
    return surnameA.localeCompare(surnameB, undefined, { sensitivity: "base" });
  });

  if (candidateEntries.length === 0) {
    doc.text("No candidate workings were recorded during this period.", margin, cursor.y);
    cursor.y += 18;
  } else {
    for (const [candidateName, events] of candidateEntries) {
      ensureSpace(doc, cursor, margin, 80);
      doc.setFont("helvetica", "bold");
      doc.text(candidateName, margin, cursor.y);
      cursor.y += 16;
      doc.setFont("helvetica", "normal");

      const sortedEvents = [...events].sort((a, b) => {
        const aDate = a.dateISO || "";
        const bDate = b.dateISO || "";
        if (aDate === bDate) return 0;
        return aDate < bDate ? -1 : 1;
      });

      const initiation = sortedEvents.find((event) => event.work === "INITIATION");
      const passing = sortedEvents.find((event) => event.work === "PASSING");
      const raising = sortedEvents.find((event) => event.work === "RAISING");

      const narrativeSegments: string[] = [];
      if (initiation?.dateISO) {
        narrativeSegments.push(`Initiated on ${formatLongDate(initiation.dateISO)}`);
      }
      if (passing?.dateISO) {
        narrativeSegments.push(`Passed on ${formatLongDate(passing.dateISO)}`);
      }
      if (raising?.dateISO) {
        narrativeSegments.push(`Raised on ${formatLongDate(raising.dateISO)}`);
      }
      let statusTail = "Awaiting first ceremony.";
      if (raising) {
        statusTail = "Completed all three degrees.";
      } else if (passing) {
        statusTail = "Awaits raising.";
      } else if (initiation) {
        statusTail = "Awaits passing.";
      }
      const narrative = narrativeSegments.length
        ? `${narrativeSegments.join(", ")}. ${statusTail}`
        : statusTail;
      const narrativeLines = doc.splitTextToSize(narrative, contentWidth);
      doc.text(narrativeLines, margin, cursor.y);
      cursor.y += narrativeLines.length * 14 + 8;

      autoTable(doc, {
        startY: cursor.y,
        margin: { left: margin, right: margin },
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 6, textColor: 0, lineColor: [0, 0, 0] },
        headStyles: { fillColor: [240, 240, 240], textColor: 0, lineColor: [0, 0, 0] },
        head: [["Date", "Ceremony", "Lodge", "Result", "Notes"]],
        body: sortedEvents.map((event) => [
          formatLongDate(event.dateISO) || "—",
          WORK_LABELS[event.work] ?? event.work ?? "—",
          lodgeLine || "—",
          determineResult(event.dateISO),
          event.notes || event.lecture || "—",
        ]),
      } as any);
      cursor.y = ((doc as any).lastAutoTable?.finalY ?? cursor.y) + 24;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    }
  }

  ensureSpace(doc, cursor, margin, 80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Emergency Meetings", margin, cursor.y);
  cursor.y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const emergencyMeetings = workingList.filter((item) => item.emergencyMeeting);
  if (emergencyMeetings.length === 0) {
    doc.text("None held.", margin, cursor.y);
    cursor.y += 18;
  } else {
    autoTable(doc, {
      startY: cursor.y,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 6, textColor: 0, lineColor: [0, 0, 0] },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, lineColor: [0, 0, 0] },
      head: [["Date", "Purpose", "Candidate(s)"]],
      body: emergencyMeetings.map((event) => [
        formatLongDate(event.dateISO) || "—",
        WORK_LABELS[event.work] ?? event.work ?? "—",
        (event.candidateName ?? "").trim() || "—",
      ]),
    } as any);
    cursor.y = ((doc as any).lastAutoTable?.finalY ?? cursor.y) + 24;
  }

  ensureSpace(doc, cursor, margin, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Grand Lodge Visits", margin, cursor.y);
  cursor.y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const grandVisits = workingList.filter((item) => item.grandLodgeVisit);
  if (grandVisits.length === 0) {
    doc.text("No Grand Lodge visits were recorded during this period.", margin, cursor.y);
    cursor.y += 18;
  } else {
    const visitDates = grandVisits
      .map((event) => formatLongDate(event.dateISO))
      .filter((value): value is string => Boolean(value));
    const visitLine = visitDates.length
      ? `Grand Lodge representatives attended on ${listDates(visitDates)}.`
      : "Grand Lodge representatives attended lodge meetings during this period.";
    const visitLines = doc.splitTextToSize(visitLine, contentWidth);
    doc.text(visitLines, margin, cursor.y);
    cursor.y += visitLines.length * 14 + 18;
  }

  ensureSpace(doc, cursor, margin, 80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Summary Tables", margin, cursor.y);
  cursor.y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const candidateOverviewRows = candidateEntries.map(([candidateName, events]) => {
    const sortedEvents = [...events].sort((a, b) => {
      const aDate = a.dateISO || "";
      const bDate = b.dateISO || "";
      if (aDate === bDate) return 0;
      return aDate < bDate ? -1 : 1;
    });
    const initiation = sortedEvents.find((event) => event.work === "INITIATION");
    const passing = sortedEvents.find((event) => event.work === "PASSING");
    const raising = sortedEvents.find((event) => event.work === "RAISING");
    let status = "Planned";
    if (raising) status = "Raised";
    else if (passing) status = "Awaiting raising";
    else if (initiation) status = "Awaiting passing";
    return [
      candidateName,
      initiation?.dateISO ? formatDate(initiation.dateISO) : "—",
      passing?.dateISO ? formatDate(passing.dateISO) : "—",
      raising?.dateISO ? formatDate(raising.dateISO) : "—",
      status,
    ];
  });

  autoTable(doc, {
    startY: cursor.y,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 6, textColor: 0, lineColor: [0, 0, 0] },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, lineColor: [0, 0, 0] },
    head: [["Candidate", "Initiated", "Passed", "Raised", "Status"]],
    body: candidateOverviewRows.length > 0 ? candidateOverviewRows : [["—", "—", "—", "—", "—"]],
  } as any);
  cursor.y = ((doc as any).lastAutoTable?.finalY ?? cursor.y) + 24;

  ensureSpace(doc, cursor, margin, 60);
  autoTable(doc, {
    startY: cursor.y,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 6, textColor: 0, lineColor: [0, 0, 0] },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, lineColor: [0, 0, 0] },
    head: [["Date", "Type", "Purpose", "Candidate", "Result"]],
    body:
      workingList.length > 0
        ? workingList.map((event) => [
            formatLongDate(event.dateISO) || "—",
            WORK_LABELS[event.work] ?? event.work ?? "—",
            event.lecture || event.notes || "—",
            (event.candidateName ?? "").trim() || "—",
            determineResult(event.dateISO),
          ])
        : [["—", "—", "—", "—", "—"]],
  } as any);
  cursor.y = ((doc as any).lastAutoTable?.finalY ?? cursor.y) + 24;

  ensureSpace(doc, cursor, margin, 100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Closing Statement", margin, cursor.y);
  cursor.y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const closingParagraph = `Thank you for your continued guidance and support of ${lodgeDisplay}. We present this report with fraternal regards.`;
  const closingLines = doc.splitTextToSize(closingParagraph, contentWidth);
  doc.text(closingLines, margin, cursor.y);
  cursor.y += closingLines.length * 14 + 20;

  doc.setFont("helvetica", "bold");
  doc.text(`Worshipful Master ${nameLine} – Lodge ${lodgeLine || "—"} – ${preparedDate}`, margin, cursor.y);

  const headerText = lodgeLine || "My Lodge";
  const periodFooter = `Reporting period: ${periodLabel}`;
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(headerText, margin, 32);
    const footerY = doc.internal.pageSize.getHeight() - 32;
    doc.text(periodFooter, margin, footerY);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" as any });
  }

  const lodgeNumberSegment = safeFileSegment(profile.lodgeNumber ?? "", "Lodge");
  const fromSegment = safeFileSegment(derivedFrom || "start", "start");
  const toSegment = safeFileSegment(derivedTo || "end", "end");
  const filename = `GSR_Report_${lodgeNumberSegment}_${fromSegment}_to_${toSegment}.pdf`;
  doc.save(filename);
}
