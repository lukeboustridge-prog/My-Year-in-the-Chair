'use client';
import React from "react";
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
  const grandLodgeValue = raw?.grandLodgeVisit ?? raw?.isGrandLodgeVisit ?? raw?.grand_lodge_visit;
  return {
    id: raw?.id,
    dateISO: toISODate(raw?.dateISO ?? raw?.date ?? ''),
    degree: degreeFromWorkType(raw?.work ?? raw?.degree),
    candidateName: raw?.candidateName ?? raw?.section ?? '',
    grandLodgeVisit: typeof grandLodgeValue === 'string'
      ? grandLodgeValue === 'true'
      : Boolean(grandLodgeValue),
    notes: raw?.comments ?? raw?.notes ?? '',
  };
}

export default function MyWorkPage() {
  const [records, setRecords] = React.useState<Working[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Working | null>(null);
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
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

  function makeKey(w: Working, index: number) {
    return w.id || `${w.dateISO}-${w.candidateName}-${index}`;
  }

  function startCreate() {
    setEditing({ ...emptyWorking });
    setEditingKey('new');
  }

  function startEdit(w: Working, key: string) {
    setEditing({ ...w });
    setEditingKey(key);
  }

  function cancelEdit() {
    setEditing(null);
    setEditingKey(null);
  }

  async function saveWorking(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const isNew = editingKey === 'new' || !editing.id;
      const work = workTypeFromDegree[editing.degree] ?? 'OTHER';
      const candidateName = editing.candidateName?.trim();
      const payload: Record<string, unknown> = {
        date: toISODate(editing.dateISO),
        work,
        candidateName: candidateName ? candidateName : undefined,
        comments: editing.notes?.trim() ? editing.notes : undefined,
        grandLodgeVisit: Boolean(editing.grandLodgeVisit),
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
      cancelEdit();
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
    if (editing?.id === id) cancelEdit();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="h1">My Lodge Workings</h1>
          <p className="subtle">View and maintain your lodge working records.</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={startCreate}>Add Working</button>
      </div>

      <div className="card">
        <div className="card-body space-y-4">
          {records === null ? (
            <div className="subtle">Loading…</div>
          ) : (
            <div className="space-y-3">
              {editingKey === 'new' && editing ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">New lodge working</h2>
                    <span className="text-xs text-slate-500">Complete the form below</span>
                  </div>
                  <form className="mt-4 space-y-4" onSubmit={saveWorking}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="label">
                        <span>Date</span>
                        <input
                          className="input mt-1"
                          type="date"
                          value={editing.dateISO}
                          onChange={e => {
                            const v = e.target.value;
                            setEditing(prev => ({ ...(prev as Working), dateISO: toISODate(v) }));
                          }}
                          required
                        />
                      </label>
                      <label className="label">
                        <span>Work of the evening (Degree)</span>
                        <select
                          className="input mt-1"
                          value={editing.degree}
                          onChange={e => setEditing(prev => ({ ...(prev as Working), degree: e.target.value as Working['degree'] }))}
                        >
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
                        <input
                          className="input mt-1"
                          type="text"
                          value={editing.candidateName}
                          onChange={e => setEditing(prev => ({ ...(prev as Working), candidateName: e.target.value }))}
                          placeholder="e.g., John Smith"
                        />
                      </label>
                      <label className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={!!editing.grandLodgeVisit}
                          onChange={e => setEditing(prev => ({ ...(prev as Working), grandLodgeVisit: e.target.checked }))}
                        />
                        <span>Grand Lodge Visit</span>
                      </label>
                    </div>
                    <label className="label">
                      <span>Notes</span>
                      <textarea
                        className="input mt-1"
                        rows={3}
                        value={editing.notes || ''}
                        onChange={e => setEditing(prev => ({ ...(prev as Working), notes: e.target.value }))}
                      />
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button type="button" className="btn-soft w-full sm:w-auto" onClick={cancelEdit}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
                        {busy ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}

              {records.length === 0 ? (
                <div className="subtle">No lodge working records yet.</div>
              ) : (
                records.map((r, index) => {
                  const key = makeKey(r, index);
                  const isEditing = editingKey === key;
                  return (
                    <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <button
                        type="button"
                        className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                        onClick={() => startEdit(r, key)}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{r.degree || '—'}</p>
                          <p className="text-xs text-slate-500">{toDisplayDate(r.dateISO)}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{r.candidateName || '—'}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{r.grandLodgeVisit ? 'GL visit' : 'Standard'}</span>
                        </div>
                      </button>
                      {isEditing && editing ? (
                        <form className="mt-4 space-y-4" onSubmit={saveWorking}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="label">
                              <span>Date</span>
                              <input
                                className="input mt-1"
                                type="date"
                                value={editing.dateISO}
                                onChange={e => {
                                  const v = e.target.value;
                                  setEditing(prev => ({ ...(prev as Working), dateISO: toISODate(v) }));
                                }}
                                required
                              />
                            </label>
                            <label className="label">
                              <span>Work of the evening (Degree)</span>
                              <select
                                className="input mt-1"
                                value={editing.degree}
                                onChange={e => setEditing(prev => ({ ...(prev as Working), degree: e.target.value as Working['degree'] }))}
                              >
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
                              <input
                                className="input mt-1"
                                type="text"
                                value={editing.candidateName}
                                onChange={e => setEditing(prev => ({ ...(prev as Working), candidateName: e.target.value }))}
                                placeholder="e.g., John Smith"
                              />
                            </label>
                            <label className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!editing.grandLodgeVisit}
                                onChange={e => setEditing(prev => ({ ...(prev as Working), grandLodgeVisit: e.target.checked }))}
                              />
                              <span>Grand Lodge Visit</span>
                            </label>
                          </div>
                          <label className="label">
                            <span>Notes</span>
                            <textarea
                              className="input mt-1"
                              rows={3}
                              value={editing.notes || ''}
                              onChange={e => setEditing(prev => ({ ...(prev as Working), notes: e.target.value }))}
                            />
                          </label>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            {editing.id ? (
                              <button
                                type="button"
                                className="navlink justify-start text-red-600 hover:text-red-700 sm:order-2"
                                onClick={() => deleteWorking(editing.id)}
                              >
                                Delete working
                              </button>
                            ) : null}
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:order-1 sm:ml-auto">
                              <button type="button" className="btn-soft w-full sm:w-auto" onClick={cancelEdit}>
                                Cancel
                              </button>
                              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
                                {busy ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
