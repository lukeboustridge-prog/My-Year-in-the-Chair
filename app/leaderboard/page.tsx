'use client';
import React from "react";
import { getLeaderboard, getVisits, getWorkings } from "../../lib/api";

type Row = { rank: number; name: string; points: number; period: '12mo'|'month' };

async function getProfileName(): Promise<string> {
  try {
    const res = await fetch('/api/profile', { credentials: 'include' });
    const data = await res.json().catch(()=> ({}));
    const prefix = (data?.prefix || '').toString().trim();
    const fullName = (data?.fullName || data?.name || [data?.firstName, data?.lastName].filter(Boolean).join(' ') || '').toString().trim();
    const post = (data?.postNominals || '').toString().trim();
    return [prefix, fullName, post].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || 'You';
  } catch {
    return 'You';
  }
}

function withinLastMonths(iso: string, months: number): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  start.setMonth(now.getMonth() - months);
  return d >= start && d <= now;
}

function withinCurrentMonth(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function LeaderboardPage() {
  const [rows12, setRows12] = React.useState<Row[]>([]);
  const [rowsM, setRowsM] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      // Try API first
      const api12 = await getLeaderboard('12mo').catch(()=>[] as Row[]);
      const apiM = await getLeaderboard('month').catch(()=>[] as Row[]);
      if (api12.length || apiM.length) {
        setRows12(api12);
        setRowsM(apiM);
        setLoading(false);
        return;
      }

      // Fallback: compute from user's own records (1 point per visit/working)
      const [name, visits, works] = await Promise.all([getProfileName(), getVisits().catch(()=>[]), getWorkings().catch(()=>[])]);
      const points12 = visits.filter(v => withinLastMonths(v.dateISO, 12)).length + works.filter(w => withinLastMonths(w.dateISO, 12)).length;
      const pointsM = visits.filter(v => withinCurrentMonth(v.dateISO)).length + works.filter(w => withinCurrentMonth(w.dateISO)).length;

      setRows12(points12 ? [{ rank: 1, name, points: points12, period: '12mo' }] : []);
      setRowsM(pointsM ? [{ rank: 1, name, points: pointsM, period: 'month' }] : []);
      setLoading(false);
    })();
  }, []);

  function Table({ title, rows }: { title: string; rows: Row[] }) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{title}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-3">Rank</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Points</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr className="border-t"><td className="py-2 pr-3" colSpan={3}>{loading ? 'Loading…' : 'No data.'}</td></tr>
                ) : rows.map(r => (
                  <tr key={`${title}-${r.rank}-${r.name}`} className="border-t">
                    <td className="py-2 pr-3">{r.rank}</td>
                    <td className="py-2 pr-3">{r.name}</td>
                    <td className="py-2 pr-3">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Leaderboard</h1>
        <span className="subtle">Rolling performance</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Table title="Rolling 12 Months" rows={rows12} />
        <Table title="Rolling Month" rows={rowsM} />
      </div>
    </div>
  );
}