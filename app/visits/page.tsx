'use client';
import React from "react";
import Modal from "../../components/Modal";
import { toISODate, toDisplayDate } from "../../lib/date";

const WORK_OPTIONS = [
  { value: "INITIATION", label: "Initiation" },
  { value: "PASSING", label: "Passing" },
  { value: "RAISING", label: "Raising" },
  { value: "INSTALLATION", label: "Installation" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "LECTURE", label: "Lecture" },
  { value: "OTHER", label: "Other" },
] as const;

type WorkType = (typeof WORK_OPTIONS)[number]["value"];

type VisitRecord = {
  id: string;
  date: string;
  lodgeName: string;
  lodgeNumber: string;
  workOfEvening: WorkType;
  grandLodgeVisit: boolean;
  candidateName: string;
  notes: string;
};

type VisitForm = Omit<VisitRecord, "id"> & { id?: string };

const DEFAULT_DATE = toISODate(new Date().toISOString());

const emptyVisit: VisitForm = {
  id: undefined,
  date: DEFAULT_DATE,
  lodgeName: "",
  lodgeNumber: "",
  workOfEvening: "INITIATION",
  grandLodgeVisit: false,
  candidateName: "",
  notes: "",
};

function normaliseVisit(raw: any): VisitRecord {
  return {
    id: String(raw?.id ?? `${raw?.date ?? ""}-${raw?.lodgeName ?? ""}`),
    date: toISODate(raw?.date ?? raw?.dateISO ?? ""),
    lodgeName: raw?.lodgeName ?? "",
    lodgeNumber: raw?.lodgeNumber ?? "",
    workOfEvening: (raw?.workOfEvening as WorkType) ?? "OTHER",
    grandLodgeVisit: Boolean(raw?.grandLodgeVisit),
    candidateName: raw?.candidateName ?? "",
    notes: raw?.notes ?? raw?.comments ?? "",
  };
}

export default function VisitsPage() {
  const [records, setRecords] = React.useState<VisitRecord[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<VisitForm | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const workOptions = React.useMemo(() => WORK_OPTIONS, []);

  const loadVisits = React.useCallback(async () => {
    try {
      const res = await fetch("/api/visits", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = Array.isArray(data) ? data.map(normaliseVisit) : [];
      setRecords(list);
      setError(null);
    } catch (err: any) {
      setRecords([]);
      setError(err?.message || "Failed to load visits");
    }
  }, []);

  React.useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  function openNew() {
    setFormError(null);
    setEditing({ ...emptyVisit, date: DEFAULT_DATE });
    setModalOpen(true);
  }

  function openEdit(record: VisitRecord) {
    setFormError(null);
    setEditing({ ...record });
    setModalOpen(true);
  }

  function closeModal() {
    if (busy) return;
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function saveVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setFormError(null);
    const payload = {
      date: toISODate(editing.date),
      lodgeName: editing.lodgeName.trim() || undefined,
      lodgeNumber: editing.lodgeNumber.trim() || undefined,
      workOfEvening: editing.workOfEvening,
      grandLodgeVisit: !!editing.grandLodgeVisit,
      candidateName: editing.candidateName.trim() || undefined,
      notes: editing.notes.trim() || undefined,
    };
    const isNew = !editing.id;
    try {
      const res = await fetch(isNew ? "/api/visits" : `/api/visits/${editing.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const saved = normaliseVisit(await res.json());
      setRecords((prev) => {
        const current = prev ? [...prev] : [];
        if (isNew) {
          return [saved, ...current];
        }
        return current.map((item) => (item.id === saved.id ? saved : item));
      });
      await loadVisits();
      setModalOpen(false);
      setEditing(null);
    } catch (err: any) {
      setFormError(err?.message || "Unable to save visit");
    } finally {
      setBusy(false);
    }
  }

  async function deleteVisit(id?: string) {
    if (!id) return;
    if (!confirm("Delete this visit?")) return;
    const previous = records ?? [];
    setRecords(previous.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/visits/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
    } catch (err) {
      setRecords(previous);
      alert((err as Error)?.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h1">Visits</h1>
          <p className="subtle">Add, view, and edit your visiting record.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          Add Visit
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {error && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          {records === null ? (
            <div className="subtle">Loading…</div>
          ) : records.length === 0 ? (
            <div className="subtle">No visits yet.</div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Lodge</th>
                      <th className="py-2 pr-3">Number</th>
                      <th className="py-2 pr-3">Work</th>
                      <th className="py-2 pr-3">GL Visit</th>
                      <th className="py-2 pr-3">Candidate</th>
                      <th className="py-2 pr-3">Notes</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-t border-slate-100">
                        <td className="py-2 pr-3 align-top font-medium text-slate-900">{toDisplayDate(record.date)}</td>
                        <td className="py-2 pr-3 align-top text-slate-700">{record.lodgeName || "—"}</td>
                        <td className="py-2 pr-3 align-top text-slate-700">{record.lodgeNumber || "—"}</td>
                        <td className="py-2 pr-3 align-top">
                          <span className="badge">
                            {workOptions.find((opt) => opt.value === record.workOfEvening)?.label ?? record.workOfEvening}
                          </span>
                        </td>
                        <td className="py-2 pr-3 align-top">{record.grandLodgeVisit ? "Yes" : "No"}</td>
                        <td className="py-2 pr-3 align-top text-slate-700">{record.candidateName || "—"}</td>
                        <td className="py-2 pr-3 align-top whitespace-pre-wrap text-slate-700">{record.notes || "—"}</td>
                        <td className="py-2 pr-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button className="btn-soft text-xs" onClick={() => openEdit(record)}>
                              Edit
                            </button>
                            <button className="btn-soft text-xs" onClick={() => deleteVisit(record.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {records.map((record) => (
                  <div key={record.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{toDisplayDate(record.date)}</div>
                        <div className="text-sm text-slate-600">
                          {record.lodgeName || "—"}
                          {record.lodgeNumber ? ` · No. ${record.lodgeNumber}` : ""}
                        </div>
                      </div>
                      <span className="badge">
                        {workOptions.find((opt) => opt.value === record.workOfEvening)?.label ?? record.workOfEvening}
                      </span>
                    </div>
                    <dl className="mt-3 space-y-1 text-sm text-slate-700">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Grand Lodge Visit</dt>
                        <dd>{record.grandLodgeVisit ? "Yes" : "No"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Candidate</dt>
                        <dd className="text-right">{record.candidateName || "—"}</dd>
                      </div>
                      {record.notes && (
                        <div>
                          <dt className="text-slate-500">Notes</dt>
                          <dd className="mt-0.5 text-right text-slate-700">{record.notes}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className="btn-soft text-xs" onClick={() => openEdit(record)}>
                        Edit
                      </button>
                      <button className="btn-soft text-xs" onClick={() => deleteVisit(record.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={modalOpen} title={editing?.id ? "Edit Visit" : "Add Visit"} onClose={closeModal}>
        {editing && (
          <form className="space-y-4" onSubmit={saveVisit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="label">
                <span>Date</span>
                <input
                  className="input mt-1"
                  type="date"
                  value={editing.date}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            date: toISODate(e.target.value),
                          }
                        : prev,
                    )
                  }
                  required
                />
              </label>
              <label className="label">
                <span>Lodge name</span>
                <input
                  className="input mt-1"
                  type="text"
                  value={editing.lodgeName}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, lodgeName: e.target.value } : prev))
                  }
                  required
                />
              </label>
              <label className="label">
                <span>Lodge number</span>
                <input
                  className="input mt-1"
                  type="text"
                  value={editing.lodgeNumber}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, lodgeNumber: e.target.value } : prev))
                  }
                />
              </label>
              <label className="label">
                <span>Work of the evening</span>
                <select
                  className="input mt-1"
                  value={editing.workOfEvening}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, workOfEvening: e.target.value as WorkType } : prev,
                    )
                  }
                >
                  {workOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label">
                <span>Candidate</span>
                <input
                  className="input mt-1"
                  type="text"
                  value={editing.candidateName}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, candidateName: e.target.value } : prev))
                  }
                  placeholder="If applicable"
                />
              </label>
              <label className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={editing.grandLodgeVisit}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, grandLodgeVisit: e.target.checked } : prev))
                  }
                />
                <span className="text-sm font-medium">Grand Lodge visit</span>
              </label>
            </div>
            <label className="label">
              <span>Notes</span>
              <textarea
                className="input mt-1"
                rows={3}
                value={editing.notes}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, notes: e.target.value } : prev))
                }
              />
            </label>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-soft" onClick={closeModal} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
