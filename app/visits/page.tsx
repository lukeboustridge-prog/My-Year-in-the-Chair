"use client";

import { useEffect, useState } from "react";
import Modal from "@/app/components/Modal";
import { WORK_TYPE_OPTIONS } from "@/lib/constants";

type Visit = {
  id: string;
  date: string;
  lodgeName?: string | null;
  lodgeNumber?: string | null;
  region?: string | null;
  workOfEvening?: string | null;
  candidateName?: string | null;
  comments?: string | null;
};

const emptyVisit: Partial<Visit> = {
  date: new Date().toISOString().slice(0,10),
  lodgeName: "",
  lodgeNumber: "",
  region: "",
  workOfEvening: "OTHER",
  candidateName: "",
  comments: "",
};

export default function VisitsPage() {
  const [rows, setRows] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Visit | null>(null);
  const [form, setForm] = useState<Partial<Visit>>(emptyVisit);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/visits");
    if (r.ok) {
      const data = await r.json();
      setRows(data);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startAdd() {
    setEditing(null);
    setForm(emptyVisit);
    setOpen(true);
  }

  function startEdit(v: Visit) {
    setEditing(v);
    setForm({
      ...v,
      date: v.date?.slice(0,10),
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...form } : form;
    const r = await fetch("/api/visits", {
      method,
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!r.ok) {
      alert("Failed to save");
      return;
    }
    setOpen(false);
    await load();
  }

  return (
    <div className="grid" style={{gap:"1.25rem"}}>
      <section className="card" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h1 style={{marginTop:0}}>Visits</h1>
          <p className="muted" style={{marginTop:".25rem"}}>Record and edit your visits.</p>
        </div>
        <button className="btn primary" onClick={startAdd}>Add New</button>
      </section>

      <section className="card">
        <h2 style={{marginTop:0}}>Your Visits</h2>
        <div style={{overflowX:"auto"}}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Lodge</th>
                <th>Region</th>
                <th>Work of evening</th>
                <th>Candidate</th>
                <th>Comments</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="muted">Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="muted">No visits yet.</td></tr>
              )}
              {rows.map(v => (
                <tr key={v.id}>
                  <td>{new Date(v.date).toDateString()}</td>
                  <td>{v.lodgeName ?? "—"}{v.lodgeNumber ? ` (${v.lodgeNumber})` : ""}</td>
                  <td>{v.region ?? "—"}</td>
                  <td>{WORK_TYPE_OPTIONS.find(o=>o.value===v.workOfEvening)?.label ?? v.workOfEvening ?? "—"}</td>
                  <td>{v.candidateName ?? "—"}</td>
                  <td>{v.comments ?? "—"}</td>
                  <td><button className="btn" onClick={()=>startEdit(v)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={open} onClose={()=>setOpen(false)} title={editing ? "Edit Visit" : "Add Visit"}>
        <div className="grid cols-2" style={{gap:"1rem"}}>
          <label className="stat">
            <span className="label">Date</span>
            <input type="date" className="card" style={{padding:".6rem"}} value={form.date as string}
              onChange={e=>setForm({...form, date: e.target.value})}/>
          </label>

          <label className="stat">
            <span className="label">Region</span>
            <input className="card" style={{padding:".6rem"}} value={form.region ?? ""}
              onChange={e=>setForm({...form, region: e.target.value})} placeholder="e.g., Northern"/>
          </label>

          <label className="stat">
            <span className="label">Lodge Name</span>
            <input className="card" style={{padding:".6rem"}} value={form.lodgeName ?? ""}
              onChange={e=>setForm({...form, lodgeName: e.target.value})} placeholder="e.g., Example Lodge"/>
          </label>

          <label className="stat">
            <span className="label">Lodge Number</span>
            <input className="card" style={{padding:".6rem"}} value={form.lodgeNumber ?? ""}
              onChange={e=>setForm({...form, lodgeNumber: e.target.value})} placeholder="e.g., No. 123"/>
          </label>

          <label className="stat">
            <span className="label">Work of the evening</span>
            <select className="card" style={{padding:".6rem"}} value={form.workOfEvening ?? "OTHER"}
              onChange={e=>setForm({...form, workOfEvening: e.target.value})}>
              {WORK_TYPE_OPTIONS.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label className="stat">
            <span className="label">Candidate name</span>
            <input className="card" style={{padding:".6rem"}} value={form.candidateName ?? ""}
              onChange={e=>setForm({...form, candidateName: e.target.value})} placeholder="(optional)"/>
          </label>

          <label className="stat" style={{gridColumn:"1 / -1"}}>
            <span className="label">Comments</span>
            <textarea className="card" style={{padding:".6rem", minHeight:120}} value={form.comments ?? ""}
              onChange={e=>setForm({...form, comments: e.target.value})}/>
          </label>
        </div>

        <div style={{marginTop:"1rem", display:"flex", gap:".5rem", justifyContent:"flex-end"}}>
          <button className="btn" onClick={()=>setOpen(false)}>Cancel</button>
          <button className="btn primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </Modal>
    </div>
  );
}
