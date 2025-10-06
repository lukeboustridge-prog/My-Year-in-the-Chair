// app/workings/page.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  listLodgeWorkings,
  createLodgeWorking,
  deleteLodgeWorking,
  type LodgeWorking,
} from '@/lib/api';

export default function LodgeWorkingsPage() {
  const [items, setItems] = useState<LodgeWorking[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string>('');
  const [lodgeName, setLodgeName] = useState('');
  const [lodgeNumber, setLodgeNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const data = await listLodgeWorkings();
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title || !date) {
      setError('Please enter a title and date');
      return;
    }
    startTransition(async () => {
      try {
        await createLodgeWorking({
          title,
          date: new Date(date).toISOString(),
          lodgeName: lodgeName || undefined,
          lodgeNumber: lodgeNumber || undefined,
          notes: notes || undefined,
        });
        setTitle('');
        setDate('');
        setLodgeName('');
        setLodgeNumber('');
        setNotes('');
        await refresh();
      } catch (e: any) {
        setError(e?.message || 'Failed to create');
      }
    });
  }

  async function onDelete(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await deleteLodgeWorking(id);
        await refresh();
      } catch (e: any) {
        setError(e?.message || 'Failed to delete');
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-8">
      <h1 className="text-2xl font-semibold">Lodge Workings</h1>

      <form onSubmit={onCreate} className="grid grid-cols-1 gap-3 rounded-2xl p-4 shadow">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="grid md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm">Title</span>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lodge Working – 2nd Degree"
            />
          </label>
          <label className="block">
            <span className="text-sm">Date</span>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm">Lodge Name</span>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={lodgeName}
              onChange={(e) => setLodgeName(e.target.value)}
              placeholder="e.g., Lodge Matariki"
            />
          </label>
          <label className="block">
            <span className="text-sm">Lodge Number</span>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={lodgeNumber}
              onChange={(e) => setLodgeNumber(e.target.value)}
              placeholder="e.g., No. 462"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm">Notes</span>
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? 'Saving...' : 'Add Working'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Lodge</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-gray-500">
                  No Lodge Workings yet
                </td>
              </tr>
            )}
            {items.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="p-3">{w.title}</td>
                <td className="p-3">
                  {new Date(w.date).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {[w.lodgeName, w.lodgeNumber].filter(Boolean).join(' ')}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => onDelete(w.id)}
                    className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                    disabled={isPending}
                    aria-label={`Delete ${w.title}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
