'use client';
import React from "react";

export default function ReportsPage() {
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function onExportVisits() {
    setBusy(true);
    try {
      // If you have lib/pdfReport, wire it here.
      // const { downloadVisitsPdf } = await import('../../lib/pdfReport');
      // await downloadVisitsPdf(profile, visits, { dateFrom: from, dateTo: to, includeNotes: true });
      alert('Connect to pdfReport helper to export.');
    } finally {
      setBusy(false);
    }
  }
  async function onExportFull() {
    setBusy(true);
    try {
      alert('Connect to pdfReport full export.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Reports</h1>
        <span className="subtle">Export your year</span>
      </div>
      <div className="card">
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <label className="label">
              <span>From</span>
              <input className="input mt-1" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
            </label>
            <label className="label">
              <span>To</span>
              <input className="input mt-1" type="date" value={to} onChange={e=>setTo(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <button className="btn-soft" onClick={onExportVisits} disabled={busy}>{busy ? 'Working…' : 'Export Visits'}</button>
              <button className="btn-primary" onClick={onExportFull} disabled={busy}>{busy ? 'Working…' : 'Export Full'}</button>
            </div>
          </div>
          <p className="subtle">Hook these buttons to your PDF generator when ready.</p>
        </div>
      </div>
    </div>
  );
}