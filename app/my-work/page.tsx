'use client';
import React from "react";
import Modal from "../../components/Modal";
import { toISODate, toDisplayDate } from "../../lib/date";

type Degree = 'Initiation' | 'Passing' | 'Raising' | 'Installation' | 'Lecture' | 'Other';
type WorkType = 'INITIATION' | 'PASSING' | 'RAISING' | 'INSTALLATION' | 'PRESENTATION' | 'LECTURE' | 'OTHER';

type Working = {
  id?: string;
  dateISO: string; // normalized YYYY-MM-DD
  degree: Degree;
  candidateName: string;
  grandLodgeVisit: boolean;
  notes?: string;
};

const emptyWorking: Working = { dateISO: '', degree: 'Initiation', candidateName: '', grandLodgeVisit: false, notes: '' };

const workTypeFromDegree: Record<Degree, WorkType> = {
  Initiation: 'INITIATION',
  Passing: 'PASSING',
  Raising: 'RAISING',
  Installation: 'INSTALLATION',
  Lecture: 'LECTURE',
  Other: 'OTHER',
};

function degreeFromWorkType(work?: string): Degree {
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

function normalizeWorking(raw: any): Working {
  return {
    id: raw?.id,
    dateISO: toISODate(raw?.dateISO ?? raw?.date ?? ''),
    degree: degreeFromWorkType(raw?.work ?? raw?.degree),
    candidateName: raw?.candidateName ?? raw?.section ?? '',
    grandLodgeVisit: Boolean(raw?.grandLodgeVisit),
    notes: raw?.comments ?? raw?.notes ?? '',
  };
}

export default function MyWorkPage() {
  const [records, setRecords] = React.useState<Working[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Working | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/mywork', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load records');
        const data = await res.json();
        const norm = (Array.isArray(data) ? data : []).map(normalizeWorking);
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
      const work = workTypeFromDegree[editing.degree] ?? 'OTHER';
      const candidateName = editing.candidateName?.trim();
      const payload: Record<string, unknown> = {
        date: toISODate(editing.dateISO),
        work,
        candidateName: candidateName ? candidateName : undefined,
        comments: editing.notes?.trim() ? editing.notes : undefined,
      };
      if (!isNew) payload.id = editing.id;
      const res = await fetch('/api/mywork', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const raw = await res.json().catch(() => null);
      const saved = normalizeWorking(raw ?? { ...payload, id: editing.id, work });
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

  async function deleteWorking(id?: string) {
    if (!id) return;
    if (!confirm('Delete this record?')) return;
    const prev = records || [];
    setRecords(prev.filter(r => r.id !== id));
    try {
      const res = await fetch('/api/mywork', {
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
                    <th className="py-2 pr-3">Candidate</th>
                    <th className="py-2 pr-3">GL Visit</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id || r.dateISO + r.candidateName} className="border-t">
                      <td className="py-2 pr-3">{toDisplayDate(r.dateISO)}</td>
                      <td className="py-2 pr-3">{r.degree || '—'}</td>
                      <td className="py-2 pr-3">{r.candidateName || '—'}</td>
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
                onChange={e=>{
                  const v = e.target.value;
                  setEditing(prev => ({...(prev as Working), dateISO: toISODate(v) }));
                }}
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
                <option>Lecture</option>
                <option>Other</option>
              </select>
            </label>
            <label className="label">
              <span>Candidate name</span>
              <input className="input mt-1" type="text" value={editing?.candidateName || ''} onChange={e=>setEditing(v=>({...(v as Working), candidateName: e.target.value}))} placeholder="e.g., John Smith" />
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