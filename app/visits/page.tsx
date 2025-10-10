'use client';

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { REGIONS } from "@/lib/regions";
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

type VisitRecord = {
  id?: string;
  date: string;
  lodgeName: string;
  lodgeNumber?: string | null;
  regionName?: string | null;
  workOfEvening: (typeof WORK_OPTIONS)[number]["value"];
  candidateName?: string | null;
  comments?: string | null;
  isGrandLodgeVisit: boolean;
  hasTracingBoards: boolean;
  grandMasterInAttendance: boolean;
};

const emptyVisit: VisitRecord = {
  date: new Date().toISOString().slice(0, 10),
  lodgeName: "",
  lodgeNumber: "",
  regionName: "",
  workOfEvening: "OTHER",
  candidateName: "",
  comments: "",
  isGrandLodgeVisit: false,
  hasTracingBoards: false,
  grandMasterInAttendance: false,
};

function formatWork(value: VisitRecord["workOfEvening"]): string {
  const option = WORK_OPTIONS.find((o) => o.value === value);
  return option?.label ?? value.replace(/_/g, " ");
}

function normaliseVisit(row: any, fallback?: VisitRecord): VisitRecord {
  return {
    id: row?.id ?? fallback?.id,
    date: toISODate(row?.date ?? row?.dateISO ?? fallback?.date ?? emptyVisit.date),
    lodgeName: row?.lodgeName ?? fallback?.lodgeName ?? "",
    lodgeNumber: row?.lodgeNumber ?? fallback?.lodgeNumber ?? "",
    regionName: row?.regionName ?? row?.region ?? fallback?.regionName ?? "",
    workOfEvening: row?.workOfEvening ?? fallback?.workOfEvening ?? "OTHER",
    candidateName: row?.candidateName ?? fallback?.candidateName ?? "",
    comments: row?.comments ?? row?.notes ?? fallback?.comments ?? "",
    isGrandLodgeVisit:
      typeof row?.isGrandLodgeVisit === "boolean"
        ? row.isGrandLodgeVisit
        : fallback?.isGrandLodgeVisit ?? false,
    hasTracingBoards:
      typeof row?.hasTracingBoards === "boolean"
        ? row.hasTracingBoards
        : fallback?.hasTracingBoards ?? false,
    grandMasterInAttendance:
      typeof row?.grandMasterInAttendance === "boolean"
        ? row.grandMasterInAttendance
        : fallback?.grandMasterInAttendance ?? false,
  };
}

function sortByDateDescending(list: VisitRecord[]): VisitRecord[] {
  return [...list].sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });
}

type VisitItemProps = {
  record: VisitRecord;
  saving: boolean;
  onSave: (next: VisitRecord) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
};

function VisitItem({ record, onSave, onDelete, saving }: VisitItemProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<VisitRecord>(record);

  useEffect(() => {
    if (!open) {
      setForm(record);
    }
  }, [record, open]);

  const lodgeDisplay = [
    form.lodgeName,
    form.lodgeNumber ? `No. ${form.lodgeNumber}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const regionDisplay = form.regionName?.trim() ? form.regionName.trim() : null;
  const highlightBadges = [
    form.isGrandLodgeVisit ? "Grand Lodge visit" : null,
    form.grandMasterInAttendance ? "Grand Master present" : null,
    form.hasTracingBoards ? "Tracing boards" : null,
  ].filter(Boolean);

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
      // parent already surfaced the error
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{lodgeDisplay || "Visit"}</p>
          <p className="text-xs text-slate-500">
            {toDisplayDate(form.date)} · {formatWork(form.workOfEvening)}
            {regionDisplay ? ` · ${regionDisplay}` : ""}
            {highlightBadges.length ? ` · ${highlightBadges.join(" · ")}` : ""}
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
                value={form.workOfEvening}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    workOfEvening: event.target.value as VisitRecord["workOfEvening"],
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
              <span>Lodge name</span>
              <input
                className="input mt-1"
                type="text"
                value={form.lodgeName}
                onChange={(event) => setForm((prev) => ({ ...prev, lodgeName: event.target.value }))}
                required
              />
            </label>
            <label className="label">
              <span>Lodge number</span>
              <input
                className="input mt-1"
                type="text"
                value={form.lodgeNumber ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, lodgeNumber: event.target.value }))}
                placeholder="Optional"
              />
            </label>
            <label className="label">
              <span>Lodge region</span>
              <select
                className="input mt-1"
                value={form.regionName ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, regionName: event.target.value }))}
              >
                <option value="">Select a region</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>
            <label className="label sm:col-span-2">
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                checked={Boolean(form.hasTracingBoards)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, hasTracingBoards: event.target.checked }))
                }
              />
              Tracing boards
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
      ) : null}
    </div>
  );
}

type VisitCreateCardProps = {
  onClose: () => void;
  onSave: (next: VisitRecord) => Promise<boolean>;
  saving: boolean;
};

function VisitCreateCard({ onClose, onSave, saving }: VisitCreateCardProps) {
  const [form, setForm] = useState<VisitRecord>({ ...emptyVisit });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await onSave(form);
    if (success) {
      setForm({ ...emptyVisit });
      onClose();
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-semibold text-slate-800">Add visit</h2>
        <button type="button" className="navlink" onClick={onClose}>
          Close
        </button>
      </div>
        <form onSubmit={handleSubmit} className="border-t border-slate-200 px-4 py-4 space-y-4 sm:px-5">
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
              value={form.workOfEvening}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  workOfEvening: event.target.value as VisitRecord["workOfEvening"],
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
            <span>Lodge name</span>
            <input
              className="input mt-1"
              type="text"
              value={form.lodgeName}
              onChange={(event) => setForm((prev) => ({ ...prev, lodgeName: event.target.value }))}
              required
            />
          </label>
          <label className="label">
            <span>Lodge number</span>
            <input
              className="input mt-1"
              type="text"
              value={form.lodgeNumber ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, lodgeNumber: event.target.value }))}
              placeholder="Optional"
            />
          </label>
          <label className="label">
            <span>Lodge region</span>
            <select
              className="input mt-1"
              value={form.regionName ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, regionName: event.target.value }))}
            >
              <option value="">Select a region</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </label>
          <label className="label sm:col-span-2">
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={Boolean(form.isGrandLodgeVisit)}
              onChange={(event) => setForm((prev) => ({ ...prev, isGrandLodgeVisit: event.target.checked }))}
            />
            Grand Lodge visit
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={Boolean(form.hasTracingBoards)}
              onChange={(event) => setForm((prev) => ({ ...prev, hasTracingBoards: event.target.checked }))}
            />
            Tracing boards
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
            {saving ? "Saving…" : "Save visit"}
          </button>
          <button type="button" className="btn-soft w-full sm:w-auto" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VisitsPage() {
  const [records, setRecords] = useState<VisitRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/visits", { credentials: "include" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const normalised: VisitRecord[] = (Array.isArray(data) ? data : [])
          .map((row: any) => normaliseVisit(row));
        setRecords(sortByDateDescending(normalised));
        setError(null);
      } catch (err: any) {
        console.error("VISITS_LOAD", err);
        setError(err?.message || "Failed to load visits");
        setRecords([]);
      }
    })();
  }, []);

  async function saveVisit(next: VisitRecord): Promise<boolean> {
    const key = next.id ?? "new";
    setSavingKey(key);
    try {
      const payload = {
        id: next.id,
        date: toISODate(next.date),
        lodgeName: next.lodgeName.trim(),
        lodgeNumber: next.lodgeNumber?.trim() || null,
        regionName: next.regionName?.trim() || null,
        workOfEvening: next.workOfEvening,
        candidateName: next.candidateName?.trim() || null,
        comments: next.comments?.trim() || null,
        isGrandLodgeVisit: Boolean(next.isGrandLodgeVisit),
        hasTracingBoards: Boolean(next.hasTracingBoards),
        grandMasterInAttendance: Boolean(next.grandMasterInAttendance),
      };
      const isNew = !payload.id;
      const body = JSON.stringify(isNew ? { ...payload, id: undefined } : payload);
      const res = await fetch("/api/visits", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body,
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json().catch(() => payload);
      const normalised = normaliseVisit(saved, payload as VisitRecord);
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
      console.error("VISITS_SAVE", err);
      alert(err?.message || "Failed to save visit");
      return false;
    } finally {
      setSavingKey(null);
    }
  }

  async function deleteVisit(id: string) {
    if (!id) return;
    if (!confirm("Delete this visit?")) {
      throw new Error("cancelled");
    }
    const previous = Array.isArray(records) ? [...records] : [];
    setRecords((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    try {
      const res = await fetch("/api/visits", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      console.error("VISITS_DELETE", err);
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
          <h1 className="h1">My Visits</h1>
          <p className="subtle">Tap a visit to expand the full details and make edits.</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setCreating(true)}>
          Add visit
        </button>
      </div>

      <div className="space-y-4">
        {creating ? (
          <VisitCreateCard onClose={() => setCreating(false)} onSave={saveVisit} saving={savingKey === "new"} />
        ) : null}

        <div className="card">
          <div className="card-body space-y-4">
            {loading ? (
              <p className="subtle">Loading…</p>
            ) : records && records.length > 0 ? (
              <div className="space-y-3">
                {records.map((record) => (
                  <VisitItem
                    key={record.id ?? `${record.date}-${record.lodgeName}`}
                    record={record}
                    onSave={saveVisit}
                    onDelete={deleteVisit}
                    saving={savingKey === (record.id ?? "")}
                  />
                ))}
              </div>
            ) : (
              <p className="subtle">No visits recorded yet.</p>
            )}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
