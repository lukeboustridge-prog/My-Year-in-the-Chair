'use client';
import { useState } from 'react';
import { createWorking } from '@/lib/api';

export default function WorkingsPage() {
  const [form, setForm] = useState({ lodgeName:'', lodgeNo:'', workingType:'', date:'', notes:'' });
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    try {
      const res = await createWorking(form);
      setMsg(`Created working ${res.id}`);
      setForm({ lodgeName:'', lodgeNo:'', workingType:'', date:'', notes:'' });
    } catch (e:any) {
      setErr(e?.message || 'Failed');
    }
  }

  return (
    <section>
      <h2>Record a Working</h2>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}
      <form onSubmit={onSubmit}>
        <label>Lodge Name</label>
        <input value={form.lodgeName} onChange={e=>setForm({...form, lodgeName:e.target.value})} />
        <label>Lodge Number</label>
        <input value={form.lodgeNo} onChange={e=>setForm({...form, lodgeNo:e.target.value})} />
        <label>Working Type</label>
        <input placeholder="1st / 2nd / 3rd / Installation" value={form.workingType} onChange={e=>setForm({...form, workingType:e.target.value})} />
        <label>Date</label>
        <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
        <label>Notes</label>
        <textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
        <div style={{marginTop:12}}><button type="submit">Add Working</button></div>
      </form>
    </section>
  );
}
