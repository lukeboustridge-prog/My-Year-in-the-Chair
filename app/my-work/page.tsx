"use client";

import { useEffect, useState } from "react";
import Modal from "@/app/components/Modal";
import { WORK_TYPE_OPTIONS } from "@/lib/constants";

type MyWork = {
  id: string;
  date: string;
  work?: string | null;
  candidateName?: string | null;
  comments?: string | null;
};

const emptyWork: Partial<MyWork> = {
  date: new Date().toISOString().slice(0,10),
  work: "OTHER",
  candidateName: "",
  comments: "",
};

export default function MyWorkPage() {
  const [rows, setRows] = useState<MyWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MyWork | null>(null);
  const [form, setForm] = useState<Partial<MyWork>>(emptyWork);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/mywork");
    if (r.ok) setRows(await r.json());
    setLoading(false);
  }
  useEffect(()=>{ load(); }, []);

  function startAdd(){
    setEditing(null); setForm(emptyWork); setOpen(true);
  }
  function startEdit(w: MyWork){
    setEditing(w);
    setForm({ ...w, date: w.date?.slice(0,10) });
    setOpen(true);
  }

  async function save(){
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...form } : form;
    const r = await fetch("/api/mywork", {
      method, headers: { "Content-Type":"application/json" }, body: JSON.stringify(body)
    });
    setSaving(false);
    if (!r.ok){ alert("Failed to save"); return; }
    setOpen(false);
    await load();
  }

  return (
    <div className="grid" style={{gap:"1.25rem"}}>
      <section className="card" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h1 style={{marginTop:0}}>My Lodge Workings</h1>
          <p className="muted" style={{marginTop:".25rem"}}>Record your lodge’s own work.</p>
        </div>
        <button className="btn primary" onClick={startAdd}>Add New</button>
      </section>

      <section className="card">
        <h2 style={{marginTop:0}}>Recorded Work</h2>
        <div style={{overflowX:"auto"}}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Work type</th>
                <th>Candidate</th>
                <th>Comments</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="muted">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={5} className="muted">No lodge work yet.</td></tr>}
              {rows.map(w => (
                <tr key={w.id}>
                  <td>{new Date(w.date).toDateString()}</td>
                  <td>{WORK_TYPE_OPTIONS.find(o=>o.value===w.work)?.label ?? w.work ?? "—"}</td>
                  <td>{w.candidateName ?? "—"}</td>
                  <td>{w.comments ?? "—"}</td>
                  <td><button className="btn" onClick={()=>startEdit(w)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={open} onClose={()=>setOpen(false)} title={editing ? "Edit Lodge Work" : "Add Lodge Work"}>
        <div className="grid cols-2" style={{gap:"1rem"}}>
          <label className="stat">
            <span className="label">Date</span>
            <input type="date" className="card" style={{padding:".6rem"}} value={form.date as string}
              onChange={e=>setForm({...form, date: e.target.value})}/>
          </label>

          <label className="stat">
            <span className="label">Work of the evening</span>
            <select className="card" style={{padding:".6rem"}} value={form.work ?? "OTHER"}
              onChange={e=>setForm({...form, work: e.target.value})}>
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
