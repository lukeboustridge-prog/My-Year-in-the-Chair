'use client';

import React from "react";
import Modal from "@/components/Modal";
import { toDisplayDate, toISODate } from "@/lib/date";

const WORK_OPTIONS = [
  { value: "INITIATION", label: "Initiation" },
  { value: "PASSING", label: "Passing" },
  { value: "RAISING", label: "Raising" },
  { value: "INSTALLATION", label: "Installation" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "LECTURE", label: "Lecture" },
  { value: "OTHER", label: "Other" },
] as const;

type TracingBoardKey = "tracingBoard1" | "tracingBoard2" | "tracingBoard3";

const TRACING_BOARD_OPTIONS: readonly {
  key: TracingBoardKey;
  label: string;
}[] = [
  { key: "tracingBoard1", label: "1st Degree Tracing Board" },
  { key: "tracingBoard2", label: "2nd Degree Tracing Board" },
  { key: "tracingBoard3", label: "3rd Degree Tracing Board" },
];

type WorkType = (typeof WORK_OPTIONS)[number]["value"];

type LodgeWorkRecord = {
  id: string;
  meetingDate: string | null;
  month: number | null;
  year: number | null;
  grandLodgeVisit: boolean;
  emergencyMeeting: boolean;
  work: WorkType;
  candidateName: string | null;
  lecture: string | null;
  tracingBoard1: boolean | null;
  tracingBoard2: boolean | null;
  tracingBoard3: boolean | null;
  notes: string | null;
};

type LodgeWorkForm = Omit<LodgeWorkRecord, "id"> & {
  id?: string;
};

const DEFAULT_DATE = toISODate(new Date().toISOString());

const emptyWork: LodgeWorkForm = {
  id: undefined,
  meetingDate: DEFAULT_DATE,
  month: null,
  year: null,
  grandLodgeVisit: false,
  emergencyMeeting: false,
  work: "OTHER",
  candidateName: "",
  lecture: "",
  tracingBoard1: false,
  tracingBoard2: false,
  tracingBoard3: false,
  notes: "",
};

function normaliseWork(raw: any): LodgeWorkRecord {
  const meetingDate = raw?.meetingDate ? toISODate(raw.meetingDate) : null;
  const month = raw?.month ?? (meetingDate ? Number(meetingDate.split("-")[1]) : null);
  const year = raw?.year ?? (meetingDate ? Number(meetingDate.split("-")[0]) : null);
  return {
    id: String(raw?.id ?? `${meetingDate ?? ""}-${raw?.work ?? ""}`),
    meetingDate,
    month,
    year,
    grandLodgeVisit: Boolean(raw?.grandLodgeVisit),
    emergencyMeeting: Boolean(raw?.emergencyMeeting),
    work: (raw?.work as WorkType) ?? "OTHER",
    candidateName: raw?.candidateName ?? null,
    lecture: raw?.lecture ?? null,
    tracingBoard1: raw?.tracingBoard1 ?? false,
    tracingBoard2: raw?.tracingBoard2 ?? false,
    tracingBoard3: raw?.tracingBoard3 ?? false,
    notes: raw?.notes ?? raw?.comments ?? null,
  };
}

function formatTracingBoards(record: LodgeWorkRecord) {
  const boards = TRACING_BOARD_OPTIONS.filter((option) => record[option.key])
    .map((option) => option.label);
  return boards.length ? boards.join(", ") : "—";
}

export default function WorkingsPage() {
  const [records, setRecords] = React.useState<LodgeWorkRecord[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<LodgeWorkForm | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const workOptions = React.useMemo(() => WORK_OPTIONS, []);
  const handleTracingBoardChange = React.useCallback(
    (key: TracingBoardKey, value: boolean) => {
      setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    [],
  );

  const loadWorkings = React.useCallback(async () => {
    try {
      const res = await fetch("/api/workings", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = Array.isArray(data) ? data.map(normaliseWork) : [];
      setRecords(list);
      setError(null);
    } catch (err: any) {
      setRecords([]);
      setError(err?.message || "Failed to load lodge workings");
    }
  }, []);

  React.useEffect(() => {
    loadWorkings();
  }, [loadWorkings]);

  function openNew() {
    setFormError(null);
    setEditing({ ...emptyWork, meetingDate: DEFAULT_DATE });
    setModalOpen(true);
  }

  function openEdit(record: LodgeWorkRecord) {
    setFormError(null);
    setEditing({
      id: record.id,
      meetingDate: record.meetingDate ?? DEFAULT_DATE,
      month: record.month,
      year: record.year,
      grandLodgeVisit: Boolean(record.grandLodgeVisit),
      emergencyMeeting: Boolean(record.emergencyMeeting),
      work: record.work,
      candidateName: record.candidateName ?? "",
      lecture: record.lecture ?? "",
      tracingBoard1: Boolean(record.tracingBoard1),
      tracingBoard2: Boolean(record.tracingBoard2),
      tracingBoard3: Boolean(record.tracingBoard3),
      notes: record.notes ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (busy) return;
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function saveWorking(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;

    const isoDate = toISODate(editing.meetingDate ?? "");
    if (!isoDate) {
      setFormError("Please choose a meeting date.");
      return;
    }
    const [yearStr, monthStr] = isoDate.split("-");
    const month = Number(monthStr);
    const year = Number(yearStr);
    if (!month || !year) {
      setFormError("Month and year could not be determined from the meeting date.");
      return;
    }

    setBusy(true);
    setFormError(null);

    const payload = {
      meetingDate: isoDate,
      month,
      year,
      grandLodgeVisit: Boolean(editing.grandLodgeVisit),
      emergencyMeeting: Boolean(editing.emergencyMeeting),
      work: editing.work,
      candidateName: editing.candidateName?.trim() || undefined,
      lecture: editing.lecture?.trim() || undefined,
      tracingBoard1: Boolean(editing.tracingBoard1),
      tracingBoard2: Boolean(editing.tracingBoard2),
      tracingBoard3: Boolean(editing.tracingBoard3),
      notes: editing.notes?.trim() || undefined,
    };
    const isNew = !editing.id;

    try {
      const res = await fetch(isNew ? "/api/workings" : `/api/workings/${editing.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const saved = normaliseWork(await res.json());
      setRecords((prev) => {
        const current = prev ? [...prev] : [];
        if (isNew) {
          return [saved, ...current];
        }
        return current.map((item) => (item.id === saved.id ? saved : item));
      });
      await loadWorkings();
      setModalOpen(false);
      setEditing(null);
    } catch (err: any) {
      setFormError(err?.message || "Unable to save lodge working");
    } finally {
      setBusy(false);
    }
  }

  async function deleteWorking(id?: string) {
    if (!id) return;
    if (!confirm("Delete this lodge working?")) return;
    const previous = records ?? [];
    setRecords(previous.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/workings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
    } catch (err: any) {
      alert(err?.message || "Unable to delete lodge working");
      setRecords(previous);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">My Lodge Workings</h1>
          <p className="subtle">Plan and review upcoming ceremonies.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          Add Lodge Working
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {records === null ? (
            <div className="subtle">Loading…</div>
          ) : records.length === 0 ? (
            <div className="subtle">No lodge workings planned yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Month</th>
                    <th className="py-2 pr-3">Work</th>
                    <th className="py-2 pr-3">Candidate</th>
                    <th className="py-2 pr-3">Lecture</th>
                    <th className="py-2 pr-3">GL Visit</th>
                    <th className="py-2 pr-3">Emergency</th>
                    <th className="py-2 pr-3">Tracing Boards</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-t">
                      <td className="py-2 pr-3">{record.meetingDate ? toDisplayDate(record.meetingDate) : "—"}</td>
                      <td className="py-2 pr-3">
                        {record.month && record.year
                          ? `${String(record.month).padStart(2, "0")}/${record.year}`
                          : "—"}
                      </td>
                      <td className="py-2 pr-3">
                        {workOptions.find((opt) => opt.value === record.work)?.label ?? record.work}
                      </td>
                      <td className="py-2 pr-3">{record.candidateName || "—"}</td>
                      <td className="py-2 pr-3">{record.lecture || "—"}</td>
                      <td className="py-2 pr-3">{record.grandLodgeVisit ? "Yes" : "No"}</td>
                      <td className="py-2 pr-3">{record.emergencyMeeting ? "Yes" : "No"}</td>
                      <td className="py-2 pr-3">{formatTracingBoards(record)}</td>
                      <td className="py-2 pr-3 whitespace-pre-wrap">{record.notes || "—"}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing?.id ? "Edit Lodge Working" : "Add Lodge Working"}
        onClose={closeModal}
      >
        {editing && (
          <form className="space-y-4" onSubmit={saveWorking}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="label">
                <span>Date</span>
                <input
                  className="input mt-1"
                  type="date"
                  value={editing.meetingDate ?? DEFAULT_DATE}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            meetingDate: toISODate(e.target.value),
                          }
                        : prev,
                    )
                  }
                  required
                />
              </label>
              <label className="label">
                <span>Work of the evening</span>
                <select
                  className="input mt-1"
                  value={editing.work}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, work: e.target.value as WorkType } : prev,
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="label">
                <span>Candidate</span>
                <input
                  className="input mt-1"
                  type="text"
                  value={editing.candidateName ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, candidateName: e.target.value } : prev,
                    )
                  }
                  placeholder="If applicable"
                />
              </label>
              <label className="label">
                <span>Lecture</span>
                <input
                  className="input mt-1"
                  type="text"
                  value={editing.lecture ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, lecture: e.target.value } : prev,
                    )
                  }
                  placeholder="Lecture or presentation details"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={Boolean(editing.grandLodgeVisit)}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, grandLodgeVisit: e.target.checked } : prev,
                    )
                  }
                />
                <span>Grand Lodge Visit</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={Boolean(editing.emergencyMeeting)}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, emergencyMeeting: e.target.checked } : prev,
                    )
                  }
                />
                <span>Emergency Meeting</span>
              </label>
            </div>
            <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <legend className="label text-sm font-semibold">Tracing Boards</legend>
              {TRACING_BOARD_OPTIONS.map((option) => (
                <label key={option.key} className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={Boolean(editing[option.key])}
                    onChange={(e) =>
                      handleTracingBoardChange(option.key, e.target.checked)
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>
            <label className="label">
              <span>Notes</span>
              <textarea
                className="input mt-1"
                rows={3}
                value={editing.notes ?? ""}
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
