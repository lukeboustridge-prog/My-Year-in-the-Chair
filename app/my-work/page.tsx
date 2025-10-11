'use client';

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { toDisplayDate, toISODate } from "../../lib/date";

const WORK_OPTIONS = [
  { value: "INITIATION", label: "First Degree" },
  { value: "PASSING", label: "Second Degree" },
  { value: "RAISING", label: "Third Degree" },
  { value: "INSTALLATION", label: "Installation" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "LECTURE", label: "Lecture" },
  { value: "OTHER", label: "Other" },
] as const;

type WorkingRecord = {
  id?: string;
  date: string;
  work: (typeof WORK_OPTIONS)[number]["value"];
  candidateName?: string | null;
  comments?: string | null;
  isGrandLodgeVisit?: boolean;
  isEmergencyMeeting?: boolean;
  hasTracingBoards?: boolean;
  hasFirstTracingBoard?: boolean;
  hasSecondTracingBoard?: boolean;
  hasThirdTracingBoard?: boolean;
  grandMasterInAttendance?: boolean;
};

const emptyRecord: WorkingRecord = {
  date: new Date().toISOString().slice(0, 10),
  work: "OTHER",
  candidateName: "",
  comments: "",
  isGrandLodgeVisit: false,
  isEmergencyMeeting: false,
  hasTracingBoards: false,
  hasFirstTracingBoard: false,
  hasSecondTracingBoard: false,
  hasThirdTracingBoard: false,
  grandMasterInAttendance: false,
};

function formatWork(value: WorkingRecord["work"]): string {
  return WORK_OPTIONS.find((option) => option.value === value)?.label ?? value.replace(/_/g, " ");
}

function normaliseWorking(row: any, fallback?: WorkingRecord): WorkingRecord {
  return {
    id: row?.id ?? fallback?.id,
    date: toISODate(row?.date ?? row?.dateISO ?? fallback?.date ?? emptyRecord.date),
    work: row?.work ?? fallback?.work ?? "OTHER",
    candidateName: row?.candidateName ?? fallback?.candidateName ?? "",
    comments: row?.comments ?? row?.notes ?? fallback?.comments ?? "",
    isGrandLodgeVisit:
      typeof row?.isGrandLodgeVisit === "boolean"
        ? row.isGrandLodgeVisit
        : fallback?.isGrandLodgeVisit ?? false,
    isEmergencyMeeting:
      typeof row?.isEmergencyMeeting === "boolean"
        ? row.isEmergencyMeeting
        : fallback?.isEmergencyMeeting ?? false,
    hasTracingBoards:
      typeof row?.hasTracingBoards === "boolean"
        ? row.hasTracingBoards
        : fallback?.hasTracingBoards ?? false,
    hasFirstTracingBoard:
      typeof row?.hasFirstTracingBoard === "boolean"
        ? row.hasFirstTracingBoard
        : fallback?.hasFirstTracingBoard ?? false,
    hasSecondTracingBoard:
      typeof row?.hasSecondTracingBoard === "boolean"
        ? row.hasSecondTracingBoard
        : fallback?.hasSecondTracingBoard ?? false,
    hasThirdTracingBoard:
      typeof row?.hasThirdTracingBoard === "boolean"
        ? row.hasThirdTracingBoard
        : fallback?.hasThirdTracingBoard ?? false,
    grandMasterInAttendance:
      typeof row?.grandMasterInAttendance === "boolean"
        ? row.grandMasterInAttendance
        : fallback?.grandMasterInAttendance ?? false,
  };
}

function sortByDateDescending(list: WorkingRecord[]): WorkingRecord[] {
  return [...list].sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });
}

type WorkingItemProps = {
  record: WorkingRecord;
  saving: boolean;
  onSave: (next: WorkingRecord) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
};

function WorkingItem({ record, onSave, onDelete, saving }: WorkingItemProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<WorkingRecord>(record);

  useEffect(() => {
    if (!open) {
      setForm(record);
    }
  }, [record, open]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setForm(record);
      }
      return next;
    });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await onSave(form);
    if (success) {
      setOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!record.id) return;
    try {
      await onDelete(record.id);
      setOpen(false);
    } catch {
      // parent alerts on failure
    }
  };

  const chips = [
    form.isGrandLodgeVisit ? "Grand Lodge" : null,
    form.isEmergencyMeeting ? "Emergency" : null,
    form.hasFirstTracingBoard ? "1st TB" : null,
    form.hasSecondTracingBoard ? "2nd TB" : null,
    form.hasThirdTracingBoard ? "3rd TB" : null,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{formatWork(form.work)}</p>
          <p className="text-xs text-slate-500">
            {toDisplayDate(form.date)}{form.candidateName ? ` · Candidate: ${form.candidateName}` : ""}
          </p>
        </div>
        <span className={`text-sm text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <form onSubmit={handleSave} className="border-t border-slate-200 px-4 py-4 space-y-4 sm:px-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="label">
              <span>Date</span>
              <input
                className="input mt-1"
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
            </label>
            <label className="label">
              <span>Work of the evening</span>
              <select
                className="input mt-1"
                value={form.work}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    work: event.target.value as WorkingRecord["work"],
                  }))
                }
              >
                {WORK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              <span>Candidate name</span>
              <input
                className="input mt-1"
                type="text"
                value={form.candidateName ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, candidateName: event.target.value }))}
                placeholder="If applicable"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(form.isGrandLodgeVisit)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isGrandLodgeVisit: event.target.checked }))
                }
              />
              Grand Lodge visit
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(form.isEmergencyMeeting)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isEmergencyMeeting: event.target.checked }))
                }
              />
              Emergency meeting
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(form.hasFirstTracingBoard)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, hasFirstTracingBoard: event.target.checked }))
                }
              />
              First tracing board
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(form.hasSecondTracingBoard)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, hasSecondTracingBoard: event.target.checked }))
                }
              />
              Second tracing board
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(form.hasThirdTracingBoard)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, hasThirdTracingBoard: event.target.checked }))
                }
              />
              Third tracing board
            </label>
          </div>
          <label className="label">
            <span>Notes</span>
            <textarea
              className="input mt-1 min-h-[6rem]"
              value={form.comments ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, comments: event.target.value }))}
              placeholder="Optional notes"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              className="btn-soft w-full sm:w-auto"
              onClick={() => {
                setForm(record);
                setOpen(false);
              }}
              disabled={saving}
            >
              Cancel
            </button>
            {record.id ? (
              <button
                type="button"
                className="btn-soft w-full sm:w-auto text-red-600"
                onClick={handleDelete}
                disabled={saving}
              >
                Delete
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        chips.length ? (
          <div className="border-t border-slate-200 px-4 py-3">
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              {chips.map((chip) => (
                <span key={chip} className="rounded-full bg-slate-100 px-2 py-1">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}

type WorkingCreateCardProps = {
  onClose: () => void;
  onSave: (next: WorkingRecord) => Promise<boolean>;
  saving: boolean;
};

function WorkingCreateCard({ onClose, onSave, saving }: WorkingCreateCardProps) {
  const [form, setForm] = useState<WorkingRecord>({ ...emptyRecord });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await onSave(form);
    if (success) {
      setForm({ ...emptyRecord });
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-slate-900/70"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="card w-full max-w-2xl"
          style={{ maxHeight: "90vh" }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex h-full flex-col" style={{ maxHeight: "min(90vh, 720px)" }}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
              <div>
                <h2 className="h2">Add lodge working</h2>
                <p className="text-sm text-slate-500">
                  Capture work details for your lodge throughout the year.
                </p>
              </div>
              <button type="button" className="btn" onClick={onClose}>
                Close
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex-1 space-y-6 overflow-y-auto p-5 pt-4 sm:p-6 sm:pt-5"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="label">
                  <span>Date</span>
                  <input
                    className="input mt-1"
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, date: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="label">
                  <span>Work of the evening</span>
                  <select
                    className="input mt-1"
                    value={form.work}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        work: event.target.value as WorkingRecord["work"],
                      }))
                    }
                  >
                    {WORK_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label md:col-span-2">
                  <span>Candidate name</span>
                  <input
                    className="input mt-1"
                    type="text"
                    value={form.candidateName ?? ""}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, candidateName: event.target.value }))
                    }
                    placeholder="If applicable"
                  />
                </label>
                <label className="label">
                  <span>Emergency meeting</span>
                  <select
                    className="input mt-1"
                    value={form.isEmergencyMeeting ? "yes" : "no"}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        isEmergencyMeeting: event.target.value === "yes",
                      }))
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(form.isGrandLodgeVisit)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        isGrandLodgeVisit: event.target.checked,
                      }))
                    }
                  />
                  Grand Lodge visit
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(form.hasTracingBoards)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        hasTracingBoards: event.target.checked,
                      }))
                    }
                  />
                  Tracing boards delivered
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(form.grandMasterInAttendance)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        grandMasterInAttendance: event.target.checked,
                      }))
                    }
                  />
                  Grand Master in attendance
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(form.hasFirstTracingBoard)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        hasFirstTracingBoard: event.target.checked,
                      }))
                    }
                  />
                  First tracing board
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(form.hasSecondTracingBoard)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        hasSecondTracingBoard: event.target.checked,
                      }))
                    }
                  />
                  Second tracing board
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(form.hasThirdTracingBoard)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        hasThirdTracingBoard: event.target.checked,
                      }))
                    }
                  />
                  Third tracing board
                </label>
              </div>
              <label className="label">
                <span>Notes</span>
                <textarea
                  className="input mt-1 min-h-[6rem]"
                  value={form.comments ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, comments: event.target.value }))
                  }
                  placeholder="Optional notes"
                />
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
                  {saving ? "Saving…" : "Save working"}
                </button>
                <button
                  type="button"
                  className="btn-soft w-full sm:w-auto"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyWorkPage() {
  const [records, setRecords] = useState<WorkingRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/mywork", { credentials: "include" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const normalised: WorkingRecord[] = (Array.isArray(data) ? data : [])
          .map((row: any) => normaliseWorking(row));
        setRecords(sortByDateDescending(normalised));
        setError(null);
      } catch (err: any) {
        console.error("MYWORK_LOAD", err);
        setError(err?.message || "Failed to load records");
        setRecords([]);
      }
    })();
  }, []);

  async function saveWorking(next: WorkingRecord): Promise<boolean> {
    const key = next.id ?? "new";
    setSavingKey(key);
    try {
      const payload = {
        id: next.id,
        date: toISODate(next.date),
        work: next.work,
        candidateName: next.candidateName?.trim() || null,
        comments: next.comments?.trim() || null,
        isGrandLodgeVisit: Boolean(next.isGrandLodgeVisit),
        isEmergencyMeeting: Boolean(next.isEmergencyMeeting),
        hasFirstTracingBoard: Boolean(next.hasFirstTracingBoard),
        hasSecondTracingBoard: Boolean(next.hasSecondTracingBoard),
        hasThirdTracingBoard: Boolean(next.hasThirdTracingBoard),
      };
      const isNew = !payload.id;
      const body = JSON.stringify(isNew ? { ...payload, id: undefined } : payload);
      const res = await fetch("/api/mywork", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body,
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json().catch(() => payload);
      const normalised = normaliseWorking(saved, payload as WorkingRecord);
      setRecords((prev) => {
        const list = Array.isArray(prev) ? [...prev] : [];
        if (isNew) {
          list.push(normalised);
        } else {
          const index = list.findIndex((record) => record.id === normalised.id);
          if (index >= 0) {
            list[index] = normalised;
          } else {
            list.push(normalised);
          }
        }
        return sortByDateDescending(list);
      });
      if (isNew) {
        setCreating(false);
      }
      return true;
    } catch (err: any) {
      console.error("MYWORK_SAVE", err);
      alert(err?.message || "Failed to save record");
      return false;
    } finally {
      setSavingKey(null);
    }
  }

  async function deleteWorking(id: string) {
    if (!id) return;
    if (!confirm("Delete this record?")) {
      throw new Error("cancelled");
    }
    const previous = Array.isArray(records) ? [...records] : [];
    setRecords((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    try {
      const res = await fetch("/api/mywork", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      console.error("MYWORK_DELETE", err);
      alert("Delete failed");
      setRecords(previous);
      throw err;
    }
  }

  const loading = records === null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h1">My Lodge Workings</h1>
          <p className="subtle">Collapse and expand records to keep your history tidy on mobile.</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setCreating(true)}>
          Add working
        </button>
      </div>

      <div className="space-y-4">
        {creating ? (
          <WorkingCreateCard onClose={() => setCreating(false)} onSave={saveWorking} saving={savingKey === "new"} />
        ) : null}

        <div className="card">
          <div className="card-body space-y-4">
            {loading ? (
              <p className="subtle">Loading…</p>
            ) : records && records.length > 0 ? (
              <div className="space-y-3">
                {records.map((record) => (
                  <WorkingItem
                    key={record.id ?? `${record.date}-${record.work}`}
                    record={record}
                    onSave={saveWorking}
                    onDelete={deleteWorking}
                    saving={savingKey === (record.id ?? "")}
                  />
                ))}
              </div>
            ) : (
              <p className="subtle">No lodge workings recorded yet.</p>
            )}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
