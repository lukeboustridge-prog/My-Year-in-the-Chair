// src/utils/pdfReport.ts
// Dynamic-import version to avoid SSR bundling errors in Next.js
// Updated typing to satisfy strict TypeScript (noImplicitAny)

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

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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