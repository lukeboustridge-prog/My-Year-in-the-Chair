"use client";

import { useMemo, useState } from "react";

type LodgeOption = { id: string; label: string };

type Props = {
  lodges: LodgeOption[];
};

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31);
}

function getDefaultDates() {
  const now = new Date();
  return {
    from: startOfYear(now),
    to: endOfYear(now),
  };
}

function toSelectOptions(options: LodgeOption[]) {
  return options.filter((option) => option.id);
}

function parseContentDisposition(value: string | null) {
  if (!value) return "GSR_Report.pdf";
  const match = /filename="?([^";]+)"?/i.exec(value);
  if (match?.[1]) return match[1];
  return "GSR_Report.pdf";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ExportGsrButtonClient({ lodges }: Props) {
  const defaults = useMemo(() => getDefaultDates(), []);
  const [from, setFrom] = useState(formatDateInput(defaults.from));
  const [to, setTo] = useState(formatDateInput(defaults.to));
  const [lodgeId, setLodgeId] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setStatus(null);
    setLoading(true);
    try {
      const response = await fetch("/api/exports/gsr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, lodgeId: lodgeId || undefined }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed with ${response.status}`);
      }
      const blob = await response.blob();
      const filename = parseContentDisposition(response.headers.get("Content-Disposition"));
      downloadBlob(blob, filename);
      setStatus("Report generated successfully.");
    } catch (error: any) {
      console.error("GSR_EXPORT", error);
      setStatus(error?.message ?? "Unable to generate report");
    } finally {
      setLoading(false);
    }
  };

  const lodgeOptions = useMemo(() => toSelectOptions(lodges), [lodges]);

  return (
    <div className="space-y-4 rounded-md border border-gray-200 p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Grand Superintendent Report</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm font-medium text-gray-700">
          From
          <input
            type="date"
            className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-gray-700">
          To
          <input
            type="date"
            className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-gray-700 sm:col-span-2">
          Lodge (optional)
          <select
            className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm"
            value={lodgeId}
            onChange={(event) => setLodgeId(event.target.value)}
          >
            <option value="">All lodges</option>
            {lodgeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {loading ? "Generating…" : "Generate GSR PDF"}
        </button>
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>
    </div>
  );
}

export type { LodgeOption };
