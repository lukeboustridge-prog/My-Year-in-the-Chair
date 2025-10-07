export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";

type LeaderboardRow = {
  id: string;
  total: number;
  user?: {
    name?: string | null;
    email?: string | null;
    lodgeName?: string | null;
    lodgeNumber?: string | null;
    region?: string | null;
  } | null;
};

async function getLeaderboardRows(start: Date, end: Date): Promise<LeaderboardRow[]> {
  const grouped = await db.visit.groupBy({
    by: ["userId"],
    where: { date: { gte: start, lte: end } },
    _count: { _all: true },
  });

  if (grouped.length === 0) return [];

  const ids = grouped.map(g => g.userId);
  const users = await db.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true, lodgeName: true, lodgeNumber: true, region: true },
  });
  const byId = new Map(users.map(u => [u.id, u]));

  return grouped
    .map(g => ({ id: g.userId, total: g._count._all, user: byId.get(g.userId) }))
    .sort((a, b) => b.total - a.total);
}

function LeaderboardTable({ title, rows, href }: { title: string; rows: LeaderboardRow[]; href: string }) {
  const topFive = rows.slice(0, 5);
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{title}</h2>
          <Link href={href} className="navlink">View full table</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3">Rank</th>
                <th className="py-2 pr-3">Master</th>
                <th className="py-2 pr-3">Lodge</th>
                <th className="py-2 pr-3">Region</th>
                <th className="py-2 pr-3">Visits</th>
              </tr>
            </thead>
            <tbody>
              {topFive.map((row, index) => (
                <tr key={row.id} className="border-t">
                  <td className="py-2 pr-3">{index + 1}</td>
                  <td className="py-2 pr-3">{row.user?.name || row.user?.email || '—'}</td>
                  <td className="py-2 pr-3">{row.user?.lodgeName || '—'}{row.user?.lodgeNumber ? ` No. ${row.user.lodgeNumber}` : ''}</td>
                  <td className="py-2 pr-3">{row.user?.region || '—'}</td>
                  <td className="py-2 pr-3 font-medium">{row.total}</td>
                </tr>
              ))}
              {topFive.length === 0 && (
                <tr className="border-t">
                  <td className="py-3 pr-3 text-sm text-slate-500" colSpan={5}>No visits recorded in this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default async function LeaderboardPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const [monthRows, yearRows] = await Promise.all([
    getLeaderboardRows(monthStart, now),
    getLeaderboardRows(yearAgo, now),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="h1">Leaderboard</h1>
          <p className="subtle mt-1">See who is leading province-wide visitation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/leaderboard/month" className="btn-soft">This month</Link>
          <Link href="/leaderboard/year" className="btn-soft">Last 12 months</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeaderboardTable title="Rolling 12 Months" rows={yearRows} href="/leaderboard/year" />
        <LeaderboardTable title="Rolling Month" rows={monthRows} href="/leaderboard/month" />
      </div>
    </div>
  );
}