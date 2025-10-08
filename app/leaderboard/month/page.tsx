export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { getUserId } from "@/lib/auth";
import {
  fetchUsersById,
  formatDisplayName,
  formatLodge,
  formatPostNominals,
  type LeaderboardUser,
} from "@/lib/leaderboard";
import { db } from "@/lib/db";

type MonthSummary = {
  label: string;
  entries: { rank: number; count: number; user: LeaderboardUser | undefined }[];
};

function buildPeriods(months: number): { label: string; start: Date; end: Date }[] {
  const now = new Date();
  const periods: { label: string; start: Date; end: Date }[] = [];
  for (let i = 0; i < months; i += 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    periods.push({
      label: start.toLocaleString(undefined, { month: "long", year: "numeric" }),
      start,
      end,
    });
  }
  return periods;
}

async function loadMonthlyLeaderboards(monthCount: number): Promise<MonthSummary[]> {
  const periods = buildPeriods(monthCount);
  const groupedResults = await Promise.all(
    periods.map((period) =>
      db.visit.groupBy({
        by: ["userId"],
        where: { date: { gte: period.start, lt: period.end } },
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 10,
      })
    )
  );

  const allUserIds = groupedResults.flatMap((rows) => rows.map((row) => row.userId));
  const users = await fetchUsersById(allUserIds);

  return groupedResults.map((rows, index) => ({
    label: periods[index]?.label ?? "",
    entries: rows.map((row, idx) => ({
      rank: idx + 1,
      count: row._count._all,
      user: users.get(row.userId),
    })),
  }));
}

export default async function Page() {
  const uid = getUserId();
  if (!uid) {
    redirect(`/login?redirect=${encodeURIComponent("/leaderboard/month")}`);
  }

  const months = await loadMonthlyLeaderboards(12);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">Monthly leaderboard</h1>
          <p className="subtle">Track how each month is shaping up across the Province.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {months.map((month) => (
          <div key={month.label} className="card">
            <div className="card-body">
              <h2 className="font-semibold mb-3">{month.label}</h2>
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
                    {month.entries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500">
                          No recorded visits.
                        </td>
                      </tr>
                    ) : (
                      month.entries.map((entry) => (
                        <tr key={entry.user?.id ?? entry.rank} className="border-t">
                          <td className="py-2 pr-3">{entry.rank}</td>
                          <td className="py-2 pr-3">
                            <div className="font-medium">{formatDisplayName(entry.user)}</div>
                            <div className="text-xs text-slate-500">{formatPostNominals(entry.user)}</div>
                          </td>
                          <td className="py-2 pr-3 text-sm">
                            {formatLodge(entry.user) || <span className="text-slate-400">—</span>}
                          </td>
                          <td className="py-2 pr-3">{entry.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
