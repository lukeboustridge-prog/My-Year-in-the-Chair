export const dynamic = "force-dynamic";

import { db } from "@/lib/db";

type Row = { id: string; name: string | null; email: string; last12: number; thisMonth: number; };

export default async function Page() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  // last 12 months
  const lb12 = await db.visit.groupBy({
    by: ["userId"],
    where: { date: { gte: yearAgo, lte: now } },
    _count: { _all: true },
    orderBy: { _count: { _all: "desc" } },
  });
  // this month
  const lbMonth = await db.visit.groupBy({
    by: ["userId"],
    where: { date: { gte: monthStart, lte: now } },
    _count: { _all: true },
    orderBy: { _count: { _all: "desc" } },
  });

  const userIds = Array.from(new Set([...lb12.map(r => r.userId), ...lbMonth.map(r => r.userId)]));
  const users = await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
  const byId = new Map(users.map(u => [u.id, u]));

  const rows: Row[] = userIds.map(id => {
    const u = byId.get(id)!;
    const last12 = lb12.find(r => r.userId === id)?._count._all ?? 0;
    const thisMonth = lbMonth.find(r => r.userId === id)?._count._all ?? 0;
    return { id, name: u?.name ?? null, email: u?.email ?? "", last12, thisMonth };
  }).sort((a,b)=> b.last12 - a.last12 || b.thisMonth - a.thisMonth);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Visitor Leaderboard</h1>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="py-2">Rank</th>
              <th>Name</th>
              <th>12-month total</th>
              <th>This month</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="py-2">{i+1}</td>
                <td>{r.name ?? r.email}</td>
                <td className="font-medium">{r.last12}</td>
                <td>{r.thisMonth}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-sm text-gray-500">No visits recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
