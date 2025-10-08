import Link from "next/link";
import { redirect } from "next/navigation";

import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  fetchUsersById,
  formatDisplayName,
  formatLodge,
  formatPostNominals,
  type LeaderboardUser,
} from "@/lib/leaderboard";

type LeaderboardEntry = {
  rank: number;
  count: number;
  user: LeaderboardUser | undefined;
};

async function getVisitLeaderboard(since: Date, limit = 10): Promise<LeaderboardEntry[]> {
  const grouped = await db.visit.groupBy({
    by: ["userId"],
    where: { date: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { userId: "desc" } },
    take: limit,
  });

  if (!grouped.length) return [];

  const map = await fetchUsersById(grouped.map((row) => row.userId));

  return grouped.map((row, index) => ({
    rank: index + 1,
    count: row._count._all,
    user: map.get(row.userId),
  }));
}

function LeaderboardTable({ title, entries }: { title: string; entries: LeaderboardEntry[] }) {
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
                <th className="py-2 pr-3">Lodge</th>
                <th className="py-2 pr-3">Visits</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr className="border-t">
                  <td className="py-3 pr-3" colSpan={4}>
                    <span className="subtle">No qualifying visits yet.</span>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const user = entry.user;
                  return (
                    <tr key={user?.id ?? entry.rank} className="border-t">
                      <td className="py-2 pr-3">{entry.rank}</td>
                      <td className="py-2 pr-3">
                        <div className="font-medium">{formatDisplayName(user)}</div>
                        <div className="text-xs text-slate-500">{formatPostNominals(user)}</div>
                      </td>
                      <td className="py-2 pr-3 text-sm">
                        {formatLodge(user) || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-2 pr-3">{entry.count}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default async function LeaderboardPage() {
  const uid = getUserId();
  if (!uid) {
    redirect("/login?redirect=/leaderboard");
  }

  const now = new Date();
  const rollingYearStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [rollingYear, rollingMonth] = await Promise.all([
    getVisitLeaderboard(rollingYearStart),
    getVisitLeaderboard(monthStart),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">Leaderboard</h1>
          <p className="subtle">Celebrating the busiest Masters in the Province.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/leaderboard/month" className="navlink">
            Monthly detail
          </Link>
          <Link href="/leaderboard/year" className="navlink">
            Yearly detail
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeaderboardTable title="Rolling 12 months" entries={rollingYear} />
        <LeaderboardTable title="This month" entries={rollingMonth} />
      </div>
    </div>
  );
}