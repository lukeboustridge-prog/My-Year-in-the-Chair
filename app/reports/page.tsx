'use client';
import React from "react";
import type { Visit, Office, Profile } from "../../lib/pdfReport";
import { downloadVisitsPdf, downloadFullPdf } from "../../lib/pdfReport";

export default function ReportsPage() {
  const profile: Profile = { prefix: "WBro", fullName: "Luke Boustridge", postNominals: "GSWB" };
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);

  // TODO: Replace with your store/API data
  const visits: Visit[] = [
    { dateISO: "2025-08-01", lodgeName: "Lodge Matariki No. 402", eventType: "Regular Meeting", role: "Visitor" },
    { dateISO: "2025-08-12", lodgeName: "Lodge Example No. 123", eventType: "Installation", role: "Master", notes: "Presented greetings" }
  ];
  const offices: Office[] = [
    { lodgeName: "Lodge Matariki No. 402", office: "Worshipful Master", startDateISO: "2025-06-01" },
    { lodgeName: "Grand Lodge of NZ", office: "Grand Sword Bearer", startDateISO: "2024-11-01", isGrandLodge: true }
  ];

  const filteredVisits = visits.filter(v => {
    const d = new Date(v.dateISO).getTime();
    const after = dateFrom ? d >= new Date(dateFrom).getTime() : true;
    const before = dateTo ? d <= new Date(dateTo).getTime() : true;
    return after && before;
  });

  const onExportVisits = async () => {
    try {
      setBusy(true);
      await downloadVisitsPdf(profile, filteredVisits, { title: "Visits Report", dateFrom, dateTo, includeNotes: true });
    } finally {
      setBusy(false);
    }
  };

  const onExportFull = async () => {
    try {
      setBusy(true);
      await downloadFullPdf(profile, filteredVisits, offices, { title: "My Year in the Chair – Full Report", dateFrom, dateTo, includeNotes: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <label className="flex flex-col gap-1">
          <span className="text-sm">From</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded p-2" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">To</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded p-2" />
        </label>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded disabled:opacity-50" onClick={onExportVisits} disabled={busy}>
            {busy ? "Exporting…" : "Export Visits PDF"}
          </button>
          <button className="px-3 py-2 border rounded disabled:opacity-50" onClick={onExportFull} disabled={busy}>
            {busy ? "Exporting…" : "Export Full PDF"}
          </button>
        </div>
      </div>

      <p className="text-sm opacity-80">
        The PDF includes your name with prefix/post-nominals, a visits table (with notes if present), and an offices table.
      </p>
    </div>
  );
}