"use client";
import { useEffect, useMemo, useState } from "react";
import { RANK_OPTIONS, RANK_META, deriveTitle } from "@/lib/constants";

const REGION_OPTIONS = Array.from({ length: 9 }, (_, idx) => `Region ${idx + 1}`);

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
  });

  // Load existing data
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile", { credentials: "include" }); if (!res.ok) return;
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
      credentials: "include",
      body: JSON.stringify(state),
    });
    setSaving(false);
    if (!res.ok) alert("Failed to save profile");
  }

  return (
    <div className="grid" style={{gap:"1.25rem", maxWidth: "640px", margin: "0 auto"}}>
      <div className="card">
        <h1 style={{marginTop:0}}>Profile</h1>

        <div className="grid cols-2" style={{gap:"1rem"}}>
          <label className="stat">
            <span className="label">Name</span>
            <input className="card" style={{padding:".6rem"}} value={state.name}
              onChange={(e)=>setState(s=>({...s, name: e.target.value}))} placeholder="e.g., John Smith"/>
          </label>

          <div className="stat">
            <span className="label">Past Grand Rank</span>
            <label className="card" style={{padding:".6rem", display:"flex", alignItems:"center", gap:".6rem"}}>
              <input type="checkbox" checked={state.isPastGrand} onChange={(e)=>setState(s=>({...s, isPastGrand: e.target.checked}))}/>
              <span className="muted">Show only Grand ranks (as Past)</span>
            </label>
          </div>

          <label className="stat" style={{gridColumn:"1 / -1"}}>
            <span className="label">Rank</span>
            <select className="card" style={{padding:".6rem"}} value={state.rank}
              onChange={(e)=>setState(s=>({...s, rank: e.target.value}))}>
              {rankList.map(r => <option key={r} value={r}>{state.isPastGrand && RANK_META[r]?.grand ? `Past ${r}` : r}</option>)}
            </select>
          </label>

          <label className="stat">
            <span className="label">Lodge Name</span>
            <input className="card" style={{padding:".6rem"}} value={state.lodgeName}
              onChange={(e)=>setState(s=>({...s, lodgeName: e.target.value}))} placeholder="e.g., Lodge Example"/>
          </label>

          <label className="stat">
            <span className="label">Lodge Number</span>
            <input className="card" style={{padding:".6rem"}} value={state.lodgeNumber}
              onChange={(e)=>setState(s=>({...s, lodgeNumber: e.target.value}))} placeholder="e.g., No. 123"/>
          </label>

          <label className="stat">
            <span className="label">Region</span>
            <select className="card" style={{padding:".6rem"}} value={state.region}
              onChange={(e)=>setState(s=>({...s, region: e.target.value}))}>
              <option value="">Select region</option>
              {REGION_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{marginTop:"1rem"}}>
          <button onClick={save} disabled={saving} className="btn primary">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
