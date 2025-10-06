'use client';
import React from "react";

type Degree = 'Initiation' | 'Passing' | 'Raising' | 'Installation' | 'Other';

export default function MyWorkPage() {
  const [date, setDate] = React.useState('');
  const [degree, setDegree] = React.useState<Degree>('Initiation');
  const [glv, setGlv] = React.useState(false);
  const [section, setSection] = React.useState('');
  const [notes, setNotes] = React.useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { date, degree, grandLodgeVisit: glv, section, notes };
    await fetch('/api/my-work', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(()=>{});
    alert('Working saved');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">My Lodge Workings</h1>
        <span className="subtle">Record your work</span>
      </div>
      <div className="card">
        <form className="card-body space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="label">
              <span>Date</span>
              <input className="input mt-1" type="date" value={date} onChange={e=>setDate(e.target.value)} required />
            </label>
            <label className="label">
              <span>Work of the evening (Degree)</span>
              <select className="input mt-1" value={degree} onChange={e=>setDegree(e.target.value as Degree)}>
                <option>Initiation</option>
                <option>Passing</option>
                <option>Raising</option>
                <option>Installation</option>
                <option>Other</option>
              </select>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={glv} onChange={e=>setGlv(e.target.checked)} />
              <span className="text-sm font-medium">Grand Lodge Visit</span>
            </label>
            <label className="label">
              <span>Part / Section</span>
              <input className="input mt-1" type="text" value={section} onChange={e=>setSection(e.target.value)} placeholder="e.g., Tracing Board, Charge" />
            </label>
          </div>
          <label className="label">
            <span>Notes</span>
            <textarea className="input mt-1" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
          </label>
          <div className="flex justify-end">
            <button className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}