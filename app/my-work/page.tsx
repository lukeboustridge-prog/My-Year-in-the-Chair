'use client';
import React from "react";
import Modal from "../../components/Modal";
import { toISODate, toDisplayDate } from "../../lib/date";

type Degree = 'Initiation' | 'Passing' | 'Raising' | 'Installation' | 'Other';

type Working = {
  id?: string;
  dateISO: string; // normalized YYYY-MM-DD
  degree: Degree;
  section: string;
  grandLodgeVisit: boolean;
  notes?: string;
};

const emptyWorking: Working = { dateISO: '', degree: 'Initiation', section: '', grandLodgeVisit: false, notes: '' };

export default function MyWorkPage() {
  const [records, setRecords] = React.useState<Working[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Working | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/my-work', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load records');
        const data = await res.json();
        const norm = (Array.isArray(data) ? data : []).map((r:any) => ({
          id: r.id,
          dateISO: toISODate(r.dateISO || r.date || ''),
          degree: r.degree || 'Other',
          section: r.section || '',
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

  function openNew() { setEditing({ ...emptyWorking }); setModalOpen(true); }
  function openEdit(w: Working) { setEditing({ ...w }); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); }

  async function saveWorking(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const isNew = !editing.id;
      const payload = {
        id: editing.id,
        dateISO: toISODate(editing.dateISO),
        degree: editing.degree,
        section: editing.section,
        grandLodgeVisit: !!editing.grandLodgeVisit,
        notes: editing.notes || ''
      };
      const res = await fetch(isNew ? '/api/my-work' : `/api/my-work/${editing.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json().catch(() => payload);
      setRecords(prev => {
        const next = prev ? [...prev] : [];
        if (isNew) return [saved as Working, ...next];
        return next.map(r => (r.id === editing.id ? (saved as Working) : r));
      });
      closeModal();
    } catch (e:any) {
      alert(e?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function deleteWorking(id?: string) {
    if (!id) return;
    if (!confirm('Delete this record?')) return;
    const prev = records || [];
    setRecords(prev.filter(r => r.id !== id));
    try {
      const res = await fetch(`/api/my-work/${id}`, { method: 'DELETE', credentials: 'include' });
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
          <h1 className="h1">My Lodge Workings</h1>
          <p className="subtle">View and maintain your lodge working records.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>Add Working</button>
      </div>

      <div className="card">
        <div className="card-body">
          {records === null ? (
            <div className="subtle">Loading…</div>
          ) : records.length === 0 ? (
            <div className="subtle">No lodge working records yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Degree</th>
                    <th className="py-2 pr-3">Section</th>
                    <th className="py-2 pr-3">GL Visit</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id || r.dateISO + r.section} className="border-t">
                      <td className="py-2 pr-3">{toDisplayDate(r.dateISO)}</td>
                      <td className="py-2 pr-3">{r.degree || '—'}</td>
                      <td className="py-2 pr-3">{r.section || '—'}</td>
                      <td className="py-2 pr-3">{r.grandLodgeVisit ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-3">{r.notes || '—'}</td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <button className="navlink" onClick={() => openEdit(r)}>Edit</button>
                          <button className="navlink" onClick={() => deleteWorking(r.id)}>Delete</button>
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

      <Modal open={modalOpen} title={editing?.id ? 'Edit Working' : 'Add Working'} onClose={closeModal}>
        <form className="space-y-4" onSubmit={saveWorking}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="label">
              <span>Date</span>
              <input
                className="input mt-1"
                type="date"
                value={editing?.dateISO || ''}
                onChange={e=>setEditing(prev => ({...(prev as Working), dateISO: e.target.value }))}
                required
              />
            </label>
            <label className="label">
              <span>Work of the evening (Degree)</span>
              <select className="input mt-1" value={editing?.degree || 'Initiation'} onChange={e=>setEditing(v=>({...(v as Working), degree: e.target.value as Working['degree']}))}>
                <option>Initiation</option>
                <option>Passing</option>
                <option>Raising</option>
                <option>Installation</option>
                <option>Other</option>
              </select>
            </label>
            <label className="label">
              <span>Part / Section</span>
              <input className="input mt-1" type="text" value={editing?.section || ''} onChange={e=>setEditing(v=>({...(v as Working), section: e.target.value}))} placeholder="e.g., Tracing Board, Charge" />
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={!!editing?.grandLodgeVisit} onChange={e=>setEditing(v=>({...(v as Working), grandLodgeVisit: e.target.checked}))} />
              <span className="text-sm font-medium">Grand Lodge Visit</span>
            </label>
          </div>
          <label className="label">
            <span>Notes</span>
            <textarea className="input mt-1" rows={3} value={editing?.notes || ''} onChange={e=>setEditing(v=>({...(v as Working), notes: e.target.value}))} />
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