'use client';
import { useState } from 'react';
import { createVisit } from '@/lib/api';

export default function VisitsPage() {
  const [form, setForm] = useState({ lodgeName:'', lodgeNo:'', date:'', notes:'' });
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    try {
      const res = await createVisit(form);
      setMsg(`Created visit ${res.id}`);
      setForm({ lodgeName:'', lodgeNo:'', date:'', notes:'' });
    } catch (e:any) {
      setErr(e?.message || 'Failed');
    }
  }

  return (
    <section>
      <h2>Record a Visit</h2>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}
      <form onSubmit={onSubmit}>
        <label>Lodge Name</label>
        <input value={form.lodgeName} onChange={e=>setForm({...form, lodgeName:e.target.value})} />
        <label>Lodge Number</label>
        <input value={form.lodgeNo} onChange={e=>setForm({...form, lodgeNo:e.target.value})} />
        <label>Date</label>
        <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
        <label>Notes</label>
        <textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
        <div style={{marginTop:12}}><button type="submit">Add Visit</button></div>
      </form>
    </section>
  );
}
