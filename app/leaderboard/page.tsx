// app/leaderboard/page.tsx — uses getLeaderboard with fallback
'use client';
import React from 'react';
import { getLeaderboard, getVisits, getWorkings, type LeaderboardRow } from '../../lib/api';

function computeLocal(): LeaderboardRow[] {
  // Placeholder local: user-only fallback for safety (will be replaced by server data if present)
  return [];
}

export default function LeaderboardPage() {
  const [rows12, setRows12] = React.useState<LeaderboardRow[]>([]);
  const [rowsM, setRowsM] = React.useState<LeaderboardRow[]>([]);

  React.useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([getLeaderboard('12mo').catch(()=>[]), getLeaderboard('month').catch(()=>[])]);
      setRows12(a.length ? a : computeLocal());
      setRowsM(b.length ? b : computeLocal());
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="h1">Leaderboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card"><div className="card-body">
          <h2 className="font-semibold mb-3">Rolling 12 Months</h2>
          {rows12.length === 0 ? <div className="subtle">No data yet.</div> :
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th className="py-2 pr-3">Rank</th><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Points</th></tr></thead>
            <tbody>{rows12.map(r=>(<tr key={r.rank} className="border-t"><td className="py-2 pr-3">#{r.rank}</td><td className="py-2 pr-3">{r.name}</td><td className="py-2 pr-3">{r.points}</td></tr>))}</tbody>
          </table>}
        </div></div>
        <div className="card"><div className="card-body">
          <h2 className="font-semibold mb-3">This Month</h2>
          {rowsM.length === 0 ? <div className="subtle">No data yet.</div> :
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th className="py-2 pr-3">Rank</th><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Points</th></tr></thead>
            <tbody>{rowsM.map(r=>(<tr key={r.rank} className="border-t"><td className="py-2 pr-3">#{r.rank}</td><td className="py-2 pr-3">{r.name}</td><td className="py-2 pr-3">{r.points}</td></tr>))}</tbody>
          </table>}
        </div></div>
      </div>
    </div>
  );
}