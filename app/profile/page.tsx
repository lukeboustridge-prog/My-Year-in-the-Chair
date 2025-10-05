"use client";
import { useEffect, useState } from "react";
import { PREFIX_OPTIONS, POST_NOMINAL_OPTIONS, REGIONS } from "@/lib/constants";

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState({
    name: "",
    prefix: "",
    postNominals: [] as string[],
    lodgeName: "",
    lodgeNumber: "",
    region: "",
    termStart: "",
    termEnd: "",
  });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const u = await res.json();
        setState(s => ({
          ...s,
          name: u.name || "",
          prefix: u.prefix || "",
          postNominals: u.postNominals || [],
          lodgeName: u.lodgeName || "",
          lodgeNumber: u.lodgeNumber || "",
          region: u.region || "",
          termStart: u.termStart ? u.termStart.slice(0,10) : "",
          termEnd: u.termEnd ? u.termEnd.slice(0,10) : "",
        }));
      }
    })();
  }, []);

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-sm">Prefix</span>
          <select
            className="border rounded px-3 py-2 w-full"
            value={state.prefix}
            onChange={(e) => setState(s => ({ ...s, prefix: e.target.value }))}
          >
            <option value="">(none)</option>
            {PREFIX_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Name</span>
          <input
            className="border rounded px-3 py-2 w-full"
            value={state.name}
            onChange={(e) => setState(s => ({ ...s, name: e.target.value }))}
            placeholder="e.g., John Smith"
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-sm">Post-nominals</span>
          <select
            multiple
            className="border rounded px-3 py-2 w-full h-28"
            value={state.postNominals}
            onChange={(e) =>
              setState(s => ({
                ...s,
                postNominals: Array.from(e.target.selectedOptions).map(o => o.value),
              }))
            }
          >
            {POST_NOMINAL_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Lodge Name</span>
          <input className="border rounded px-3 py-2 w-full"
            value={state.lodgeName}
            onChange={(e) => setState(s => ({ ...s, lodgeName: e.target.value }))}
            placeholder="e.g., Lodge Example"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Lodge Number</span>
          <input className="border rounded px-3 py-2 w-full"
            value={state.lodgeNumber}
            onChange={(e) => setState(s => ({ ...s, lodgeNumber: e.target.value }))}
            placeholder="e.g., No. 123"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Region</span>
          <select
            className="border rounded px-3 py-2 w-full"
            value={state.region}
            onChange={(e) => setState(s => ({ ...s, region: e.target.value }))}
          >
            <option value="">(select)</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Term start</span>
          <input type="date" className="border rounded px-3 py-2 w-full"
            value={state.termStart}
            onChange={(e) => setState(s => ({ ...s, termStart: e.target.value }))} />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Term end</span>
          <input type="date" className="border rounded px-3 py-2 w-full"
            value={state.termEnd}
            onChange={(e) => setState(s => ({ ...s, termEnd: e.target.value }))} />
        </label>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
