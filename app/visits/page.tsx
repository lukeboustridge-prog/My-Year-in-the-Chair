'use client';

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import Modal from "../../components/Modal";
import { toDisplayDate, toISODate } from "../../lib/date";

const WORK_OPTIONS = [
  { value: "INITIATION", label: "Initiation" },
  { value: "PASSING", label: "Passing" },
  { value: "RAISING", label: "Raising" },
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
  workOfEvening: (typeof WORK_OPTIONS)[number]["value"];
  candidateName?: string | null;
  comments?: string | null;
  isGrandLodgeVisit: boolean;
  hasTracingBoards: boolean;
};

const emptyVisit: VisitRecord = {
  date: new Date().toISOString().slice(0, 10),
  lodgeName: "",
  lodgeNumber: "",
  workOfEvening: "OTHER",
  candidateName: "",
  comments: "",
  isGrandLodgeVisit: false,
  hasTracingBoards: false,
};

function formatWork(value: VisitRecord["workOfEvening"]): string {
  const option = WORK_OPTIONS.find((o) => o.value === value);
  return option?.label ?? value.replace(/_/g, " ");
}

export default function VisitsPage() {
  const [records, setRecords] = useState<VisitRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VisitRecord | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/visits", { credentials: "include" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const normalised: VisitRecord[] = (Array.isArray(data) ? data : []).map((row: any) => ({
          id: row.id,
          date: toISODate(row.date ?? row.dateISO ?? ""),
          lodgeName: row.lodgeName ?? "",
          lodgeNumber: row.lodgeNumber ?? "",
          workOfEvening: row.workOfEvening ?? "OTHER",
          candidateName: row.candidateName ?? "",
          comments: row.comments ?? row.notes ?? "",
          isGrandLodgeVisit: Boolean(row.isGrandLodgeVisit),
          hasTracingBoards: Boolean(row.hasTracingBoards),
        }));
        setRecords(normalised);
        setError(null);
      } catch (err: any) {
        console.error("VISITS_LOAD", err);
        setError(err?.message || "Failed to load visits");
        setRecords([]);
      }
    })();
  }, []);

  function openNew() {
    setEditing({ ...emptyVisit });
    setModalOpen(true);
  }

  function openEdit(visit: VisitRecord) {
    setEditing({ ...visit });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function saveVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const payload = {
        id: editing.id,
        date: toISODate(editing.date),
        lodgeName: editing.lodgeName.trim(),
        lodgeNumber: editing.lodgeNumber?.trim() || null,
        workOfEvening: editing.workOfEvening,
        candidateName: editing.candidateName?.trim() || null,
        comments: editing.comments?.trim() || null,
        isGrandLodgeVisit: editing.isGrandLodgeVisit,
        hasTracingBoards: editing.hasTracingBoards,
      };
      const isNew = !payload.id;
      const { id, ...createPayload } = payload;
      const body = JSON.stringify(isNew ? createPayload : payload);
      const res = await fetch("/api/visits", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body,
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json().catch(() => payload);
      setRecords((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const normalised = {
          id: saved.id ?? payload.id ?? id,
          date: toISODate(saved.date ?? payload.date),
          lodgeName: saved.lodgeName ?? payload.lodgeName,
          lodgeNumber: saved.lodgeNumber ?? payload.lodgeNumber ?? "",
          workOfEvening: saved.workOfEvening ?? payload.workOfEvening,
          candidateName: saved.candidateName ?? payload.candidateName ?? "",
          comments: saved.comments ?? saved.notes ?? payload.comments ?? "",
          isGrandLodgeVisit:
            typeof saved.isGrandLodgeVisit === "boolean"
              ? saved.isGrandLodgeVisit
              : payload.isGrandLodgeVisit,
          hasTracingBoards:
            typeof saved.hasTracingBoards === "boolean"
              ? saved.hasTracingBoards
              : payload.hasTracingBoards,
        } as VisitRecord;
        if (isNew) {
          next.unshift(normalised);
          return next;
        }
        return next.map((row) => (row.id === normalised.id ? normalised : row));
      });
      closeModal();
    } catch (err: any) {
      console.error("VISITS_SAVE", err);
      alert(err?.message || "Failed to save visit");
    } finally {
      setBusy(false);
    }
  }

  async function deleteVisit(id?: string) {
    if (!id) return;
    if (!confirm("Delete this visit?")) return;
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
    }
  }

  const tableRows = useMemo(() => {
    if (!records) return null;
    return records.map((record) => (
      <tr key={record.id ?? record.date + record.lodgeName} className="border-t">
        <td className="py-2 pr-3 whitespace-nowrap">{toDisplayDate(record.date)}</td>
        <td className="py-2 pr-3 min-w-[12rem]">
          <div className="font-medium">{record.lodgeName || "—"}</div>
          <div className="text-xs text-slate-500">{record.lodgeNumber || ""}</div>
        </td>
        <td className="py-2 pr-3 whitespace-nowrap">{formatWork(record.workOfEvening)}</td>
        <td className="py-2 pr-3 whitespace-nowrap">{record.candidateName || "—"}</td>
        <td className="py-2 pr-3 whitespace-nowrap">{record.isGrandLodgeVisit ? "Yes" : "No"}</td>
        <td className="py-2 pr-3 whitespace-nowrap">{record.hasTracingBoards ? "Yes" : "No"}</td>
        <td className="py-2 pr-3 min-w-[12rem]">{record.comments || "—"}</td>
        <td className="py-2 pr-3">
          <div className="flex gap-2">
            <button className="navlink" onClick={() => openEdit(record)}>Edit</button>
            <button className="navlink" onClick={() => deleteVisit(record.id)}>Delete</button>
          </div>
        </td>
      </tr>
    ));
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">Visits</h1>
          <p className="subtle">Log every official visit during your year.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>Add Visit</button>
      </div>

      <div className="card">
        <div className="card-body">
          {records === null ? (
            <div className="subtle">Loading…</div>
          ) : records.length === 0 ? (
            <div className="subtle">No visits recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Lodge</th>
                    <th className="py-2 pr-3">Work</th>
                    <th className="py-2 pr-3">Candidate</th>
                    <th className="py-2 pr-3">Grand Lodge</th>
                    <th className="py-2 pr-3">Tracing Boards</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>{tableRows}</tbody>
              </table>
            </div>
          )}
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
      </div>

      <Modal open={modalOpen} title={editing?.id ? "Edit Visit" : "Add Visit"} onClose={closeModal}>
        <form className="space-y-4" onSubmit={saveVisit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="label">
              <span>Date</span>
              <input
                className="input mt-1"
                type="date"
                value={editing?.date ?? ""}
                onChange={(event) =>
                  setEditing((prev) => ({ ...(prev as VisitRecord), date: event.target.value }))
                }
                required
              />
            </label>
            <label className="label">
              <span>Lodge name</span>
              <input
                className="input mt-1"
                type="text"
                value={editing?.lodgeName ?? ""}
                onChange={(event) =>
                  setEditing((prev) => ({ ...(prev as VisitRecord), lodgeName: event.target.value }))
                }
                required
              />
            </label>
            <label className="label">
              <span>Lodge number</span>
              <input
                className="input mt-1"
                type="text"
                value={editing?.lodgeNumber ?? ""}
                onChange={(event) =>
                  setEditing((prev) => ({ ...(prev as VisitRecord), lodgeNumber: event.target.value }))
                }
              />
            </label>
            <label className="label">
              <span>Work of the evening</span>
              <select
                className="input mt-1"
                value={editing?.workOfEvening ?? "OTHER"}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...(prev as VisitRecord),
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
              <span>Candidate name</span>
              <input
                className="input mt-1"
                type="text"
                value={editing?.candidateName ?? ""}
                onChange={(event) =>
                  setEditing((prev) => ({ ...(prev as VisitRecord), candidateName: event.target.value }))
                }
                placeholder="If applicable"
              />
            </label>
            <label className="label flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={editing?.isGrandLodgeVisit ?? false}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...(prev as VisitRecord),
                    isGrandLodgeVisit: event.target.checked,
                  }))
                }
              />
              <span>Grand Lodge visit</span>
            </label>
            <label className="label flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={editing?.hasTracingBoards ?? false}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...(prev as VisitRecord),
                    hasTracingBoards: event.target.checked,
                  }))
                }
              />
              <span>Tracing boards delivered</span>
            </label>
          </div>
          <label className="label">
            <span>Notes</span>
            <textarea
              className="input mt-1"
              rows={4}
              value={editing?.comments ?? ""}
              onChange={(event) =>
                setEditing((prev) => ({ ...(prev as VisitRecord), comments: event.target.value }))
              }
              placeholder="Presentations, honours, tracing boards, etc."
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-soft" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}