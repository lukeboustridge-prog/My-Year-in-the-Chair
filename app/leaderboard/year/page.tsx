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

type YearSummary = {
  label: string;
  entries: { rank: number; count: number; user: LeaderboardUser | undefined }[];
};

function buildYearRanges(yearCount: number): { label: string; start: Date; end: Date }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const ranges: { label: string; start: Date; end: Date }[] = [];
  for (let i = 0; i < yearCount; i += 1) {
    const year = currentYear - i;
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    ranges.push({
      label: `${year}`,
      start,
      end,
    });
  }
  return ranges;
}

async function loadYearlyLeaderboards(yearCount: number): Promise<YearSummary[]> {
  const ranges = buildYearRanges(yearCount);
  const grouped = await Promise.all(
    ranges.map((range) =>
      db.visit.groupBy({
        by: ["userId"],
        where: { date: { gte: range.start, lt: range.end } },
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
        take: 15,
      })
    )
  );

  const allIds = grouped.flatMap((rows) => rows.map((row) => row.userId));
  const users = await fetchUsersById(allIds);

  return grouped.map((rows, index) => ({
    label: ranges[index]?.label ?? "",
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
    redirect(`/login?redirect=${encodeURIComponent("/leaderboard/year")}`);
  }

  const years = await loadYearlyLeaderboards(5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">Yearly leaderboard</h1>
          <p className="subtle">The long view of visiting excellence.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {years.map((year) => (
          <div key={year.label} className="card">
            <div className="card-body">
              <h2 className="font-semibold mb-3">{year.label}</h2>
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
                    {year.entries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500">
                          No recorded visits.
                        </td>
                      </tr>
                    ) : (
                      year.entries.map((entry) => (
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
