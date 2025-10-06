'use client';
import React from "react";

type VisitFormState = {
  date: string;
  lodgeName: string;
  degree: 'Initiation' | 'Passing' | 'Raising' | 'Installation' | 'Other';
  grandLodgeVisit: boolean;
  notes?: string;
};

export default function VisitsPage() {
  const [form, setForm] = React.useState<VisitFormState>({
    date: '',
    lodgeName: '',
    degree: 'Initiation',
    grandLodgeVisit: false,
    notes: ''
  });

  function update<K extends keyof VisitFormState>(key: K, value: VisitFormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Post to your API
    await fetch('/api/visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).catch(()=>{});
    alert('Saved visit');
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Visits</h1>

      <form onSubmit={onSubmit} className="bg-white border rounded-2xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Date</span>
            <input type="date" value={form.date} onChange={e=>update('date', e.target.value)} className="border rounded-lg px-3 py-2" required/>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Lodge</span>
            <input type="text" value={form.lodgeName} onChange={e=>update('lodgeName', e.target.value)} className="border rounded-lg px-3 py-2" required/>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Work of the evening</span>
            <select value={form.degree} onChange={e=>update('degree', e.target.value as VisitFormState['degree'])} className="border rounded-lg px-3 py-2">
              <option>Initiation</option>
              <option>Passing</option>
              <option>Raising</option>
              <option>Installation</option>
              <option>Other</option>
            </select>
          </label>
          <label className="flex items-center gap-2 mt-6">
            <input type="checkbox" checked={form.grandLodgeVisit} onChange={e=>update('grandLodgeVisit', e.target.checked)} />
            <span className="text-sm font-medium">Grand Lodge Visit</span>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Notes</span>
          <textarea value={form.notes} onChange={e=>update('notes', e.target.value)} className="border rounded-lg px-3 py-2" rows={3}/>
        </label>
        <div className="flex justify-end">
          <button className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm">Save</button>
        </div>
      </form>
    </div>
  );
}