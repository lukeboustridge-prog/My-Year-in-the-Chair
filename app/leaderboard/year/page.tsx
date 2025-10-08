export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Page() {
  const uid = getUserId();
  if (!uid) {
    redirect(`/login?redirect=${encodeURIComponent("/leaderboard/year")}`);
  }

  const now = new Date();
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const grouped = await db.visit.groupBy({
    by: ["userId"],
    where: { date: { gte: yearAgo, lte: now } },
    _count: { _all: true },
  });

  const ids = grouped.map(g => g.userId);
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true, lodgeName: true, lodgeNumber: true, region: true } });
  const byId = new Map(users.map(u => [u.id, u]));

  const rows = grouped.map(g => ({
    id: g.userId,
    count: g._count._all,
    user: byId.get(g.userId)!,
  })).sort((a,b)=> b.count - a.count);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Leaderboard — Last 12 Months</h1>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="py-2">Rank</th>
              <th>Master</th>
              <th>Lodge</th>
              <th>Region</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={r.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="py-2">{i+1}</td>
                <td>{r.user?.name ?? r.user?.email}</td>
                <td>{r.user?.lodgeName ?? "—"} {r.user?.lodgeNumber ? `No. ${r.user.lodgeNumber}` : ""}</td>
                <td>{r.user?.region ?? "—"}</td>
                <td className="font-medium">{r.count}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="py-4 text-sm text-gray-500">No visits yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
