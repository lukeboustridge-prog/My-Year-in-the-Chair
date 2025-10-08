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

type WorkingRecord = {
  id?: string;
  date: string;
  work: (typeof WORK_OPTIONS)[number]["value"];
  candidateName?: string | null;
  comments?: string | null;
  isGrandLodgeVisit?: boolean;
  isEmergencyMeeting?: boolean;
  hasFirstTracingBoard?: boolean;
  hasSecondTracingBoard?: boolean;
  hasThirdTracingBoard?: boolean;
};

const emptyRecord: WorkingRecord = {
  date: new Date().toISOString().slice(0, 10),
  work: "OTHER",
  candidateName: "",
  comments: "",
  isGrandLodgeVisit: false,
  isEmergencyMeeting: false,
  hasFirstTracingBoard: false,
  hasSecondTracingBoard: false,
  hasThirdTracingBoard: false,
};

function formatWork(value: WorkingRecord["work"]): string {
  return WORK_OPTIONS.find((option) => option.value === value)?.label ?? value.replace(/_/g, " ");
}

export default function MyWorkPage() {
  const [records, setRecords] = useState<WorkingRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkingRecord | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/mywork", { credentials: "include" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const normalised: WorkingRecord[] = (Array.isArray(data) ? data : []).map((row: any) => ({
          id: row.id,
          date: toISODate(row.date ?? row.dateISO ?? ""),
          work: row.work ?? "OTHER",
          candidateName: row.candidateName ?? "",
          comments: row.comments ?? row.notes ?? "",
          isGrandLodgeVisit: Boolean(row.isGrandLodgeVisit),
          isEmergencyMeeting: Boolean(row.isEmergencyMeeting),
          hasFirstTracingBoard: Boolean(row.hasFirstTracingBoard),
          hasSecondTracingBoard: Boolean(row.hasSecondTracingBoard),
          hasThirdTracingBoard: Boolean(row.hasThirdTracingBoard),
        }));
        setRecords(normalised);
        setError(null);
      } catch (err: any) {
        console.error("MYWORK_LOAD", err);
        setError(err?.message || "Failed to load records");
        setRecords([]);
      }
    })();
  }, []);

  function openNew() {
    setEditing({ ...emptyRecord });
    setModalOpen(true);
  }

  function openEdit(record: WorkingRecord) {
    setEditing({ ...record });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function saveWorking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const payload = {
        id: editing.id,
        date: toISODate(editing.date),
        work: editing.work,
        candidateName: editing.candidateName?.trim() || null,
        comments: editing.comments?.trim() || null,
        isGrandLodgeVisit: Boolean(editing.isGrandLodgeVisit),
        isEmergencyMeeting: Boolean(editing.isEmergencyMeeting),
        hasFirstTracingBoard: Boolean(editing.hasFirstTracingBoard),
        hasSecondTracingBoard: Boolean(editing.hasSecondTracingBoard),
        hasThirdTracingBoard: Boolean(editing.hasThirdTracingBoard),
      };
      const isNew = !payload.id;
      const { id, ...createPayload } = payload;
      const res = await fetch("/api/mywork", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(isNew ? createPayload : payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json().catch(() => payload);
      setRecords((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const normalised: WorkingRecord = {
          id: saved.id ?? payload.id ?? id,
          date: toISODate(saved.date ?? payload.date),
          work: saved.work ?? payload.work,
          candidateName: saved.candidateName ?? payload.candidateName ?? "",
          comments: saved.comments ?? saved.notes ?? payload.comments ?? "",
          isGrandLodgeVisit:
            typeof saved.isGrandLodgeVisit === "boolean"
              ? saved.isGrandLodgeVisit
              : payload.isGrandLodgeVisit,
          isEmergencyMeeting:
            typeof saved.isEmergencyMeeting === "boolean"
              ? saved.isEmergencyMeeting
              : payload.isEmergencyMeeting,
          hasFirstTracingBoard:
            typeof saved.hasFirstTracingBoard === "boolean"
              ? saved.hasFirstTracingBoard
              : payload.hasFirstTracingBoard,
          hasSecondTracingBoard:
            typeof saved.hasSecondTracingBoard === "boolean"
              ? saved.hasSecondTracingBoard
              : payload.hasSecondTracingBoard,
          hasThirdTracingBoard:
            typeof saved.hasThirdTracingBoard === "boolean"
              ? saved.hasThirdTracingBoard
              : payload.hasThirdTracingBoard,
        };
        if (isNew) {
          next.unshift(normalised);
          return next;
        }
        return next.map((row) => (row.id === normalised.id ? normalised : row));
      });
      closeModal();
    } catch (err: any) {
      console.error("MYWORK_SAVE", err);
      alert(err?.message || "Failed to save record");
    } finally {
      setBusy(false);
    }
  }

  async function deleteWorking(id?: string) {
    if (!id) return;
    if (!confirm("Delete this record?")) return;
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
    }
  }

  const tableRows = useMemo(() => {
    if (!records) return null;
    return records.map((record) => (
      <tr key={record.id ?? record.date + record.work} className="border-t">
        <td className="py-2 pr-3 whitespace-nowrap">{toDisplayDate(record.date)}</td>
        <td className="py-2 pr-3 whitespace-nowrap">{formatWork(record.work)}</td>
        <td className="py-2 pr-3 whitespace-nowrap">{record.candidateName || "—"}</td>
        <td className="py-2 pr-3 whitespace-nowrap">{record.isGrandLodgeVisit ? "Yes" : "No"}</td>
        <td className="py-2 pr-3 whitespace-nowrap">{record.isEmergencyMeeting ? "Yes" : "No"}</td>
        <td className="py-2 pr-3 whitespace-nowrap">{record.hasFirstTracingBoard ? "Yes" : "No"}</td>
        <td className="py-2 pr-3 whitespace-nowrap">{record.hasSecondTracingBoard ? "Yes" : "No"}</td>
        <td className="py-2 pr-3 whitespace-nowrap">{record.hasThirdTracingBoard ? "Yes" : "No"}</td>
        <td className="py-2 pr-3 min-w-[12rem]">{record.comments || "—"}</td>
        <td className="py-2 pr-3">
          <div className="flex gap-2">
            <button className="navlink" onClick={() => openEdit(record)}>
              Edit
            </button>
            <button className="navlink" onClick={() => deleteWorking(record.id)}>
              Delete
            </button>
          </div>
        </td>
      </tr>
    ));
  }, [records]);

  const mobileRows = useMemo(() => {
    if (!records) return null;
    return records.map((record) => (
      <div
        key={record.id ?? record.date + record.work}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <p className="font-medium text-slate-900">{formatWork(record.work)}</p>
            <p className="text-xs text-slate-500">{toDisplayDate(record.date)}</p>
          </div>
          {record.candidateName ? (
            <p className="text-sm text-slate-600">
              Candidate: <span className="font-medium">{record.candidateName}</span>
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
              Grand Lodge: {record.isGrandLodgeVisit ? "Yes" : "No"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
              Emergency: {record.isEmergencyMeeting ? "Yes" : "No"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
              1st TB: {record.hasFirstTracingBoard ? "Yes" : "No"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
              2nd TB: {record.hasSecondTracingBoard ? "Yes" : "No"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
              3rd TB: {record.hasThirdTracingBoard ? "Yes" : "No"}
            </span>
          </div>
          {record.comments ? (
            <p className="text-sm text-slate-600">{record.comments}</p>
          ) : null}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <button type="button" className="btn-soft w-full sm:w-auto" onClick={() => openEdit(record)}>
              Edit
            </button>
            <button
              type="button"
              className="btn-soft w-full sm:w-auto"
              onClick={() => deleteWorking(record.id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    ));
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h1">My Lodge Workings</h1>
          <p className="subtle">Track tracing boards, emergency meetings, and special work during your year.</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={openNew}>
          Add Working
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {records === null ? (
            <div className="subtle">Loading…</div>
          ) : records.length === 0 ? (
            <div className="subtle">No lodge workings recorded yet.</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Work</th>
                      <th className="py-2 pr-3">Candidate</th>
                      <th className="py-2 pr-3">Grand Lodge</th>
                      <th className="py-2 pr-3">Emergency</th>
                      <th className="py-2 pr-3">1st TB</th>
                      <th className="py-2 pr-3">2nd TB</th>
                      <th className="py-2 pr-3">3rd TB</th>
                      <th className="py-2 pr-3">Notes</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>{tableRows}</tbody>
                </table>
              </div>
              <div className="grid gap-3 md:hidden">{mobileRows}</div>
            </>
          )}
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
      </div>

      <Modal open={modalOpen} title={editing?.id ? "Edit Working" : "Add Working"} onClose={closeModal}>
        <form className="space-y-4" onSubmit={saveWorking}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="label">
              <span>Date</span>
              <input
                className="input mt-1"
                type="date"
                value={editing?.date ?? ""}
                onChange={(event) =>
                  setEditing((prev) => ({ ...(prev as WorkingRecord), date: event.target.value }))
                }
                required
              />
            </label>
            <label className="label">
              <span>Work of the evening</span>
              <select
                className="input mt-1"
                value={editing?.work ?? "OTHER"}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...(prev as WorkingRecord),
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
                value={editing?.candidateName ?? ""}
                onChange={(event) =>
                  setEditing((prev) => ({ ...(prev as WorkingRecord), candidateName: event.target.value }))
                }
                placeholder="If applicable"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(editing?.isGrandLodgeVisit)}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...(prev as WorkingRecord),
                    isGrandLodgeVisit: event.target.checked,
                  }))
                }
              />
              Grand Lodge visit
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(editing?.isEmergencyMeeting)}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...(prev as WorkingRecord),
                    isEmergencyMeeting: event.target.checked,
                  }))
                }
              />
              Emergency meeting
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(editing?.hasFirstTracingBoard)}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...(prev as WorkingRecord),
                    hasFirstTracingBoard: event.target.checked,
                  }))
                }
              />
              1st tracing board
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(editing?.hasSecondTracingBoard)}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...(prev as WorkingRecord),
                    hasSecondTracingBoard: event.target.checked,
                  }))
                }
              />
              2nd tracing board
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(editing?.hasThirdTracingBoard)}
                onChange={(event) =>
                  setEditing((prev) => ({
                    ...(prev as WorkingRecord),
                    hasThirdTracingBoard: event.target.checked,
                  }))
                }
              />
              3rd tracing board
            </label>
          </div>
          <label className="label">
            <span>Notes / Section</span>
            <textarea
              className="input mt-1"
              rows={4}
              value={editing?.comments ?? ""}
              onChange={(event) =>
                setEditing((prev) => ({ ...(prev as WorkingRecord), comments: event.target.value }))
              }
              placeholder="Tracing board, lecture, presentation, emergency meeting details…"
            />
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-soft w-full sm:w-auto" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
