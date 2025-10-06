'use client';
import React from "react";
import { getLeaderboard } from "../../lib/api";

type Row = { rank: number; name: string; points: number; period: '12mo'|'month' };

export default function LeaderboardPage() {
  const [rows12, setRows12] = React.useState<Row[]>([]);
  const [rowsM, setRowsM] = React.useState<Row[]>([]);

  React.useEffect(() => {
    (async () => {
      try { setRows12(await getLeaderboard('12mo')); } catch { setRows12([]); }
      try { setRowsM(await getLeaderboard('month')); } catch { setRowsM([]); }
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
                  <tr className="border-t"><td className="py-2 pr-3" colSpan={3}>No data.</td></tr>
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