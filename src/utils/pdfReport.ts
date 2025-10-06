// src/utils/pdfReport.ts
// Dynamic-import version to avoid SSR bundling errors in Next.js
// Updated typing to satisfy strict TypeScript (noImplicitAny)

type JsPdfInstance = InstanceType<typeof import("jspdf").jsPDF>;
type AutoTable = typeof import("jspdf-autotable").default;
type AutoTableOptions = import("jspdf-autotable").UserOptions;

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

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return dateFormatter.format(d);
}

export async function generateMyYearPdf(
  profile: Profile,
  visits: Visit[],
  offices: Office[],
  opts: ReportOptions = {}
): Promise<JsPdfInstance> {
  if (typeof window === "undefined") {
    throw new Error("PDF generation must run in the browser.");
  }
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable: AutoTable = autoTableModule.default;

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
    const visitHeadRow = ["Date", "Lodge", "Event", "Role"];
    if (opts.includeNotes) {
      visitHeadRow.push("Notes");
    }

    const visitTableOptions = {
      startY: pageYStart + 20,
      head: [visitHeadRow],
      body: visits.map(v => {
        const row = [formatDate(v.dateISO), v.lodgeName, v.eventType, v.role || ""];
        if (opts.includeNotes) {
          row.push(v.notes || "");
        }
        return row;
      }),
      styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: [15, 76, 129] },
      theme: "striped" as const,
      didDrawPage: () => {
        const str = `Page ${doc.getCurrentPageInfo().pageNumber}`;
        doc.setFontSize(9);
        doc.text(str, doc.internal.pageSize.getWidth() - 60, doc.internal.pageSize.getHeight() - 20);
      },
    } satisfies AutoTableOptions;

    autoTable(doc, visitTableOptions);
  }

  // Offices table
  if (opts.includeOffices !== false && offices.length) {
    const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    const officeTableOptions = {
      startY: lastTable ? lastTable.finalY + 20 : pageYStart + 20,
      head: [["Lodge", "Office", "Start", "End", "Type"]],
      body: offices.map(o => [
        o.lodgeName,
        o.office,
        formatDate(o.startDateISO),
        o.endDateISO ? formatDate(o.endDateISO) : "Current",
        o.isGrandLodge ? "Grand Lodge" : "Craft Lodge",
      ]),
      styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: [15, 76, 129] },
      theme: "striped" as const,
    } satisfies AutoTableOptions;

    autoTable(doc, officeTableOptions);
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