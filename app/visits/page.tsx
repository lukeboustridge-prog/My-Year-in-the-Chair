'use client';
import React from "react";
import Modal from "../../components/Modal";
import { toISODate, toDisplayDate } from "../../lib/date";

type Degree = 'Initiation' | 'Passing' | 'Raising' | 'Installation' | 'Lecture' | 'Other';
type WorkType = 'INITIATION' | 'PASSING' | 'RAISING' | 'INSTALLATION' | 'PRESENTATION' | 'LECTURE' | 'OTHER';

type Visit = {
  id?: string;
  dateISO: string; // normalized YYYY-MM-DD
  lodgeName: string;
  lodgeNumber: string;
  eventType: Degree;
  grandLodgeVisit: boolean;
  notes?: string;
};

const emptyVisit: Visit = { dateISO: '', lodgeName: '', lodgeNumber: '', eventType: 'Initiation', grandLodgeVisit: false, notes: '' };

const workTypeFromLabel: Record<Degree, WorkType> = {
  Initiation: 'INITIATION',
  Passing: 'PASSING',
  Raising: 'RAISING',
  Installation: 'INSTALLATION',
  Lecture: 'LECTURE',
  Other: 'OTHER',
};

function labelFromWorkType(work?: string): Degree {
  switch ((work || '').toUpperCase()) {
    case 'INITIATION':
      return 'Initiation';
    case 'PASSING':
      return 'Passing';
    case 'RAISING':
      return 'Raising';
    case 'INSTALLATION':
      return 'Installation';
    case 'LECTURE':
      return 'Lecture';
    default:
      return 'Other';
  }
}

function normalizeVisit(raw: any): Visit {
  return {
    id: raw?.id,
    dateISO: toISODate(raw?.dateISO ?? raw?.date ?? ''),
    lodgeName: raw?.lodgeName ?? raw?.lodge ?? '',
    lodgeNumber: raw?.lodgeNumber ?? raw?.lodgeNo ?? '',
    eventType: labelFromWorkType(raw?.workOfEvening ?? raw?.eventType ?? raw?.degree),
    grandLodgeVisit: Boolean(raw?.grandLodgeVisit),
    notes: raw?.comments ?? raw?.notes ?? '',
  };
}

export default function VisitsPage() {
  const [records, setRecords] = React.useState<Visit[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Visit | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/visits', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load visits');
        const data = await res.json();
        const norm = (Array.isArray(data) ? data : []).map(normalizeVisit);
        setRecords(norm);
      } catch (e:any) {
        setRecords([]);
        setError(e?.message || 'Failed to load');
      }
    })();
  }, []);

  function openNew() { setEditing({ ...emptyVisit }); setModalOpen(true); }
  function openEdit(v: Visit) { setEditing({ ...v }); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); }

  async function saveVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const isNew = !editing.id;
      const workOfEvening = workTypeFromLabel[editing.eventType] ?? 'OTHER';
      const lodgeNumber = editing.lodgeNumber?.trim();
      const payload: Record<string, unknown> = {
        date: toISODate(editing.dateISO),
        lodgeName: editing.lodgeName || undefined,
        lodgeNumber: lodgeNumber ? lodgeNumber : undefined,
        workOfEvening,
        comments: editing.notes?.trim() ? editing.notes : undefined,
      };
      if (!isNew) payload.id = editing.id;
      const res = await fetch('/api/visits', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const raw = await res.json().catch(() => null);
      const saved = normalizeVisit(raw ?? { ...payload, id: editing.id, workOfEvening });
      setRecords(prev => {
        const next = prev ? [...prev] : [];
        if (isNew) return [saved, ...next];
        return next.map(r => (r.id === editing.id ? saved : r));
      });
      closeModal();
    } catch (e:any) {
      alert(e?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function deleteVisit(id?: string) {
    if (!id) return;
    if (!confirm('Delete this visit?')) return;
    const prev = records || [];
    setRecords(prev.filter(r => r.id !== id));
    try {
      const res = await fetch('/api/visits', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      setRecords(prev);
      alert('Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">Visits</h1>
          <p className="subtle">Add, view, and edit your visiting record.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>Add Visit</button>
      </div>

      <div className="card">
        <div className="card-body">
          {records === null ? (
            <div className="subtle">Loading…</div>
          ) : records.length === 0 ? (
            <div className="subtle">No visits yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Lodge</th>
                    <th className="py-2 pr-3">Lodge No.</th>
                    <th className="py-2 pr-3">Work</th>
                    <th className="py-2 pr-3">GL Visit</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id || r.dateISO + r.lodgeName + r.lodgeNumber} className="border-t">
                      <td className="py-2 pr-3">{toDisplayDate(r.dateISO)}</td>
                      <td className="py-2 pr-3">{r.lodgeName || '—'}</td>
                      <td className="py-2 pr-3">{r.lodgeNumber || '—'}</td>
                      <td className="py-2 pr-3">{r.eventType || '—'}</td>
                      <td className="py-2 pr-3">{r.grandLodgeVisit ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-3">{r.notes || '—'}</td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <button className="navlink" onClick={() => openEdit(r)}>Edit</button>
                          <button className="navlink" onClick={() => deleteVisit(r.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
      </div>

      <Modal open={modalOpen} title={editing?.id ? 'Edit Visit' : 'Add Visit'} onClose={closeModal}>
        <form className="space-y-4" onSubmit={saveVisit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="label">
              <span>Date</span>
              <input
                className="input mt-1"
                type="date"
                value={editing?.dateISO || ''}
                onChange={e=>{
                  const v = e.target.value;
                  setEditing(prev => ({...(prev as Visit), dateISO: toISODate(v) }));
                }}
                required
              />
            </label>
            <label className="label">
              <span>Lodge</span>
              <input className="input mt-1" type="text" value={editing?.lodgeName || ''} onChange={e=>setEditing(v=>({...(v as Visit), lodgeName: e.target.value}))} required />
            </label>
            <label className="label">
              <span>Lodge number</span>
              <input className="input mt-1" type="text" value={editing?.lodgeNumber || ''} onChange={e=>setEditing(v=>({...(v as Visit), lodgeNumber: e.target.value}))} placeholder="e.g., 123" />
            </label>
            <label className="label">
              <span>Work of the evening (Degree)</span>
              <select className="input mt-1" value={editing?.eventType || 'Initiation'} onChange={e=>setEditing(v=>({...(v as Visit), eventType: e.target.value as Visit['eventType']}))}>
                <option>Initiation</option>
                <option>Passing</option>
                <option>Raising</option>
                <option>Installation</option>
                <option>Lecture</option>
                <option>Other</option>
              </select>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={!!editing?.grandLodgeVisit} onChange={e=>setEditing(v=>({...(v as Visit), grandLodgeVisit: e.target.checked}))} />
              <span className="text-sm font-medium">Grand Lodge Visit</span>
            </label>
          </div>
          <label className="label">
            <span>Notes</span>
            <textarea className="input mt-1" rows={3} value={editing?.notes || ''} onChange={e=>setEditing(v=>({...(v as Visit), notes: e.target.value}))} />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-soft" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}