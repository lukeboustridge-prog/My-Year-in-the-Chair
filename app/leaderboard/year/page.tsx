export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import PendingApprovalNotice from "@/components/PendingApprovalNotice";
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
        where: { date: { gte: range.start, lt: range.end }, user: { isApproved: true } },
        _count: { _all: true },
        orderBy: { _count: { userId: "desc" } },
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

  const viewer = await db.user.findUnique({
    where: { id: uid },
    select: { isApproved: true, role: true },
  });

  if (!viewer) {
    redirect(`/login?redirect=${encodeURIComponent("/leaderboard/year")}`);
  }

  const isApprover = viewer.role === "ADMIN" || viewer.role === "GRAND_SUPERINTENDENT";

  if (!viewer.isApproved && !isApprover) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="h1">Yearly leaderboard</h1>
            <p className="subtle">The long view of visiting excellence.</p>
          </div>
        </div>
        <PendingApprovalNotice />
      </div>
    );
  }

  const years = await loadYearlyLeaderboards(5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h1">Yearly leaderboard</h1>
          <p className="subtle">The long view of visiting excellence.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {years.map((year) => (
          <div key={year.label} className="card">
            <div className="card-body space-y-4">
              <h2 className="font-semibold">{year.label}</h2>
              <div className="hidden md:block overflow-x-auto">
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
              <div className="grid gap-3 md:hidden">
                {year.entries.length === 0 ? (
                  <p className="text-sm text-slate-500">No recorded visits.</p>
                ) : (
                  year.entries.map((entry) => (
                    <div
                      key={entry.user?.id ?? entry.rank}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Rank</p>
                          <p className="text-2xl font-semibold text-slate-900">{entry.rank}</p>
                        </div>
                        <div className="text-right text-sm text-slate-600">
                          <p className="font-medium text-slate-900">{formatDisplayName(entry.user)}</p>
                          <p className="text-xs text-slate-500">{formatPostNominals(entry.user)}</p>
                          <p className="text-xs text-slate-500">{formatLodge(entry.user) || "—"}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-600">
                        Visits: <span className="font-semibold">{entry.count}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
