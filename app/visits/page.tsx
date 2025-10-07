'use client';
import React from "react";
import Modal from "../../components/Modal";
import { toISODate, toDisplayDate } from "../../lib/date";

type Degree = 'Initiation' | 'Passing' | 'Raising' | 'Installation' | 'Other';

type Visit = {
  id?: string;
  dateISO: string; // normalized YYYY-MM-DD
  lodgeName: string;
  eventType: Degree;
  grandLodgeVisit: boolean;
  notes?: string;
};

const emptyVisit: Visit = { dateISO: '', lodgeName: '', eventType: 'Initiation', grandLodgeVisit: false, notes: '' };

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
        const norm = (Array.isArray(data) ? data : []).map((r:any) => ({
          id: r.id,
          dateISO: toISODate(r.dateISO || r.date || ''),
          lodgeName: r.lodgeName || r.lodge || '',
          eventType: r.eventType || r.degree || 'Other',
          grandLodgeVisit: Boolean(r.grandLodgeVisit),
          notes: r.notes || ''
        }));
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
      const payload = {
        id: editing.id,
        dateISO: toISODate(editing.dateISO),
        lodgeName: editing.lodgeName,
        eventType: editing.eventType,
        grandLodgeVisit: !!editing.grandLodgeVisit,
        notes: editing.notes || ''
      };
      const res = await fetch(isNew ? '/api/visits' : `/api/visits/${editing.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json().catch(() => payload);
      setRecords(prev => {
        const next = prev ? [...prev] : [];
        if (isNew) return [saved as Visit, ...next];
        return next.map(r => (r.id === editing.id ? (saved as Visit) : r));
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
      const res = await fetch(`/api/visits/${id}`, { method: 'DELETE', credentials: 'include' });
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
                    <th className="py-2 pr-3">Work</th>
                    <th className="py-2 pr-3">GL Visit</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id || r.dateISO + r.lodgeName} className="border-t">
                      <td className="py-2 pr-3">{toDisplayDate(r.dateISO)}</td>
                      <td className="py-2 pr-3">{r.lodgeName || '—'}</td>
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
                value={editing?.dateISO ? toISODate(editing.dateISO) : ''}
                onChange={e=>{
                  const v = e.target.value;
                  setEditing(prev => ({ ...(prev as Visit), dateISO: toISODate(v) }));
                }}
                required
              />
            </label>
            <label className="label">
              <span>Lodge</span>
              <input className="input mt-1" type="text" value={editing?.lodgeName || ''} onChange={e=>setEditing(v=>({...(v as Visit), lodgeName: e.target.value}))} required />
            </label>
            <label className="label">
              <span>Work of the evening (Degree)</span>
              <select className="input mt-1" value={editing?.eventType || 'Initiation'} onChange={e=>setEditing(v=>({...(v as Visit), eventType: e.target.value as Visit['eventType']}))}>
                <option>Initiation</option>
                <option>Passing</option>
                <option>Raising</option>
                <option>Installation</option>
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