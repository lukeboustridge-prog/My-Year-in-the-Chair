"use client";
import { useEffect, useState } from "react";
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

export default function VisitsPage() {
  const [list, setList] = useState<Visit[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Visit>>({ date: new Date().toISOString().slice(0,10) });

  async function load() {
    const res = await fetch("/api/visits");
    const data = await res.json();
    setList(data.visits);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    setCreating(true);
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) { setForm({ date: new Date().toISOString().slice(0,10) }); await load(); }
    else alert(await res.text());
  }

  async function saveRow(v: Visit) {
    const res = await fetch(`/api/visits/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    if (!res.ok) alert(await res.text());
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Visits</h1>

      {/* Create */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <label className="space-y-1">
          <span className="text-sm">Date</span>
          <input type="date" className="border rounded px-3 py-2 w-full"
            value={form.date as string}
            onChange={(e)=>setForm(s=>({...s, date: e.target.value}))}/>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Lodge Name</span>
          <input className="border rounded px-3 py-2 w-full"
            value={form.lodgeName || ""}
            onChange={(e)=>setForm(s=>({...s, lodgeName: e.target.value}))}/>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Lodge No.</span>
          <input className="border rounded px-3 py-2 w-full"
            value={form.lodgeNumber || ""}
            onChange={(e)=>setForm(s=>({...s, lodgeNumber: e.target.value}))}/>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Region</span>
          <input className="border rounded px-3 py-2 w-full"
            value={form.region || ""}
            onChange={(e)=>setForm(s=>({...s, region: e.target.value}))}/>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Work of the Evening</span>
          <select className="border rounded px-3 py-2 w-full"
            value={form.workOfEvening || ""}
            onChange={(e)=>setForm(s=>({...s, workOfEvening: e.target.value}))}>
            <option value="">(select)</option>
            {WORK_TYPE_OPTIONS.map(w=>(
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Candidate Name (if any)</span>
          <input className="border rounded px-3 py-2 w-full"
            value={form.candidateName || ""}
            onChange={(e)=>setForm(s=>({...s, candidateName: e.target.value}))}/>
        </label>

        <label className="space-y-1 md:col-span-3">
          <span className="text-sm">Comments</span>
          <input className="border rounded px-3 py-2 w-full"
            value={form.comments || ""}
            onChange={(e)=>setForm(s=>({...s, comments: e.target.value}))}/>
        </label>

        <button
          onClick={create}
          disabled={creating}
          className="px-4 py-2 rounded bg-black text-white md:col-span-3 disabled:opacity-50"
        >
          {creating ? "Saving…" : "Add Visit"}
        </button>
      </div>

      {/* List & inline edit */}
      <div className="space-y-4">
        {list.map(v=>(
          <div key={v.id} className="border rounded p-3 grid grid-cols-1 md:grid-cols-6 gap-2">
            <input type="date" className="border rounded px-2 py-1"
              value={v.date.slice(0,10)} onChange={(e)=>setList(ls=>ls.map(x=>x.id===v.id?{...x, date:e.target.value}:x))}/>
            <input className="border rounded px-2 py-1" placeholder="Lodge"
              value={v.lodgeName||""} onChange={(e)=>setList(ls=>ls.map(x=>x.id===v.id?{...x, lodgeName:e.target.value}:x))}/>
            <input className="border rounded px-2 py-1" placeholder="No."
              value={v.lodgeNumber||""} onChange={(e)=>setList(ls=>ls.map(x=>x.id===v.id?{...x, lodgeNumber:e.target.value}:x))}/>
            <input className="border rounded px-2 py-1" placeholder="Region"
              value={v.region||""} onChange={(e)=>setList(ls=>ls.map(x=>x.id===v.id?{...x, region:e.target.value}:x))}/>
            <select className="border rounded px-2 py-1"
              value={v.workOfEvening||""}
              onChange={(e)=>setList(ls=>ls.map(x=>x.id===v.id?{...x, workOfEvening:e.target.value}:x))}>
              <option value="">(work)</option>
              {WORK_TYPE_OPTIONS.map(w=><option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
            <input className="border rounded px-2 py-1" placeholder="Candidate"
              value={v.candidateName||""} onChange={(e)=>setList(ls=>ls.map(x=>x.id===v.id?{...x, candidateName:e.target.value}:x))}/>

            <input className="border rounded px-2 py-1 md:col-span-5" placeholder="Comments"
              value={v.comments||""} onChange={(e)=>setList(ls=>ls.map(x=>x.id===v.id?{...x, comments:e.target.value}:x))}/>

            <div className="flex gap-2">
              <button className="px-3 py-1 rounded bg-black text-white"
                onClick={()=>saveRow(v)}>Save</button>
              <button className="px-3 py-1 rounded border"
                onClick={async ()=>{
                  const res = await fetch(`/api/visits/${v.id}`, { method:"DELETE" });
                  if (res.ok) setList(ls=>ls.filter(x=>x.id!==v.id));
                }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
