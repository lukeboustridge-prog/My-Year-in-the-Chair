"use client";
import { useEffect, useMemo, useState } from "react";
import { RANK_OPTIONS, RANK_META, deriveTitle } from "@/lib/constants";

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState({
    name: "",
    rank: "Master Mason",
    isPastGrand: false,
    prefix: "",
    postNominals: [] as string[],
    lodgeName: "",
    lodgeNumber: "",
    region: "",
    termStart: "",
    termEnd: "",
  });

  // Load existing data
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile"); if (!res.ok) return;
      const u = await res.json();
      setState(s => ({
        ...s,
        name: u.name || "",
        rank: u.rank || "Master Mason",
        isPastGrand: u.isPastGrand ?? false,
        prefix: u.prefix || "",
        postNominals: u.postNominals || [],
        lodgeName: u.lodgeName || "",
        lodgeNumber: u.lodgeNumber || "",
        region: u.region || "",
        termStart: u.termStart ? u.termStart.slice(0, 10) : "",
        termEnd: u.termEnd ? u.termEnd.slice(0, 10) : "",
      }));
    })();
  }, []);

  // Auto-derive prefix & post-nominals from current rank + isPastGrand
  useEffect(() => {
    const derived = deriveTitle(state.rank, state.isPastGrand);
    setState(s => ({ ...s, prefix: derived.prefix, postNominals: derived.postNominals }));
  }, [state.rank, state.isPastGrand]);

  const grandRanks = useMemo(() => RANK_OPTIONS.filter(r => RANK_META[r]?.grand), []);
  const nonGrandRanks = useMemo(() => RANK_OPTIONS.filter(r => !RANK_META[r]?.grand), []);
  const rankList = state.isPastGrand ? grandRanks : RANK_OPTIONS;

  async function save() {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    setSaving(false);
    if (!res.ok) alert("Failed to save profile");
  }

  function close() {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/dashboard";
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="card w-full max-w-lg overflow-hidden sm:max-w-xl md:max-w-2xl max-h-[90vh]">
          <div className="card-body space-y-6 overflow-y-auto p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="h2">Edit profile</h1>
                <p className="text-sm text-slate-500">Update your personal and lodge details.</p>
              </div>
              <button
                className="btn"
                type="button"
                onClick={close}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="stat">
                <span className="label">Name</span>
                <input
                  className="card"
                  style={{ padding: ".6rem" }}
                value={state.name}
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g., John Smith"
              />
            </label>

            <div className="stat">
              <span className="label">Past Grand Rank</span>
              <label className="card flex items-center gap-3" style={{ padding: ".6rem" }}>
                <input
                  type="checkbox"
                  checked={state.isPastGrand}
                  onChange={(e) =>
                    setState((s) => ({ ...s, isPastGrand: e.target.checked }))
                  }
                />
                <span className="muted">Show only Grand ranks (as Past)</span>
              </label>
            </div>

            <label className="stat md:col-span-2">
              <span className="label">Rank</span>
              <select
                className="card"
                style={{ padding: ".6rem" }}
                value={state.rank}
                onChange={(e) => setState((s) => ({ ...s, rank: e.target.value }))}
              >
                {rankList.map((r) => (
                  <option key={r} value={r}>
                    {state.isPastGrand && RANK_META[r]?.grand ? `Past ${r}` : r}
                  </option>
                ))}
              </select>
            </label>

            <label className="stat">
              <span className="label">Lodge Name</span>
              <input
                className="card"
                style={{ padding: ".6rem" }}
                value={state.lodgeName}
                onChange={(e) =>
                  setState((s) => ({ ...s, lodgeName: e.target.value }))
                }
                placeholder="e.g., Lodge Example"
              />
            </label>

            <label className="stat">
              <span className="label">Lodge Number</span>
              <input
                className="card"
                style={{ padding: ".6rem" }}
                value={state.lodgeNumber}
                onChange={(e) =>
                  setState((s) => ({ ...s, lodgeNumber: e.target.value }))
                }
                placeholder="e.g., No. 123"
              />
            </label>

            <label className="stat">
              <span className="label">Region</span>
              <select
                className="card"
                style={{ padding: ".6rem" }}
                value={state.region}
                onChange={(e) => setState((s) => ({ ...s, region: e.target.value }))}
              >
                <option value="">Select a region</option>
                {Array.from({ length: 9 }).map((_, idx) => {
                  const region = `Region ${idx + 1}`;
                  return (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="stat">
              <span className="label">Term start</span>
              <input
                type="date"
                className="card"
                style={{ padding: ".6rem" }}
                value={state.termStart}
                onChange={(e) =>
                  setState((s) => ({ ...s, termStart: e.target.value }))
                }
              />
            </label>

            <label className="stat">
              <span className="label">Term end</span>
              <input
                type="date"
                className="card"
                style={{ padding: ".6rem" }}
                value={state.termEnd}
                onChange={(e) => setState((s) => ({ ...s, termEnd: e.target.value }))}
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn"
              onClick={close}
            >
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
