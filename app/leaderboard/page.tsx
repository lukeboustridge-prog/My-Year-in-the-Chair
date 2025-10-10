import Link from "next/link";
import { redirect } from "next/navigation";

import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import PendingApprovalNotice from "@/components/PendingApprovalNotice";
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

type LeaderboardFilters = {
  limit?: number;
  region?: string;
};

async function getVisitLeaderboard(
  since: Date,
  { limit = 10, region }: LeaderboardFilters = {},
): Promise<LeaderboardEntry[]> {
  const grouped = await db.visit.groupBy({
    by: ["userId"],
    where: {
      date: { gte: since },
      user: {
        isApproved: true,
        ...(region ? { region } : {}),
      },
    },
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
  const mobileEntries = entries.map((entry) => {
    const user = entry.user;
    const displayName = formatDisplayName(user);
    const postNominals = formatPostNominals(user);
    const nameWithPostNominals = (
      <div className="flex flex-wrap justify-end gap-x-2 gap-y-1">
        <span className="font-medium text-slate-900">{displayName}</span>
        {postNominals ? (
          <span className="font-medium text-slate-900">{postNominals}</span>
        ) : null}
      </div>
    );
    return (
      <div key={user?.id ?? entry.rank} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Rank</p>
            <p className="text-2xl font-semibold text-slate-900">{entry.rank}</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            {nameWithPostNominals}
            <p className="text-xs text-slate-500">{formatLodge(user) || "—"}</p>
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-600">Visits: <span className="font-semibold">{entry.count}</span></div>
      </div>
    );
  });

  return (
    <div className="card">
      <div className="card-body space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
        </div>
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
              {entries.length === 0 ? (
                <tr className="border-t">
                  <td className="py-3 pr-3" colSpan={4}>
                    <span className="subtle">No qualifying visits yet.</span>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const user = entry.user;
                  const displayName = formatDisplayName(user);
                  const postNominals = formatPostNominals(user);
                  return (
                    <tr key={user?.id ?? entry.rank} className="border-t">
                      <td className="py-2 pr-3">{entry.rank}</td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-medium text-slate-900">{displayName}</span>
                          {postNominals ? (
                            <span className="font-medium text-slate-900">{postNominals}</span>
                          ) : null}
                        </div>
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
        <div className="grid gap-3 md:hidden">
          {entries.length === 0 ? (
            <p className="text-sm text-slate-500">No qualifying visits yet.</p>
          ) : (
            mobileEntries
          )}
        </div>
      </div>
    </div>
  );
}

type LeaderboardSearchParams = {
  scope?: string;
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: LeaderboardSearchParams;
}) {
  const uid = getUserId();
  if (!uid) {
    redirect("/login?redirect=/leaderboard");
  }

  const viewer = await db.user.findUnique({
    where: { id: uid },
    select: { isApproved: true, role: true, region: true },
  });

  if (!viewer) {
    redirect("/login?redirect=/leaderboard");
  }

  const now = new Date();
  const rollingYearStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const isApprover = viewer.role === "ADMIN" || viewer.role === "DISTRICT";

  const requestedScope = searchParams?.scope === "region" ? "region" : "national";
  const scope = viewer.region ? requestedScope : "national";
  const regionFilter = scope === "region" ? viewer.region : undefined;

  const filterLabel = scope === "region" ? viewer.region ?? "My Region" : "National";

  const scopedHeading = scope === "region" ? filterLabel : "National";

  if (!viewer.isApproved && !isApprover) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="h1">Leaderboard</h1>
            <p className="subtle">Celebrating the busiest Masters in the Districts.</p>
          </div>
        </div>
        <PendingApprovalNotice />
      </div>
    );
  }

  const [rollingYear, rollingMonth] = await Promise.all([
    getVisitLeaderboard(rollingYearStart, { region: regionFilter }),
    getVisitLeaderboard(monthStart, { region: regionFilter }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h1">Leaderboard</h1>
          <p className="subtle">Celebrating the busiest Masters in the Districts.</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex w-full items-center justify-between gap-2 text-sm sm:justify-end">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <Link
                href="/leaderboard"
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  scope === "national"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                National
              </Link>
              {viewer.region ? (
                <Link
                  href="/leaderboard?scope=region"
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    scope === "region"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  My Region
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-md px-3 py-1.5 font-medium text-slate-300">
                  My Region
                </span>
              )}
            </div>
            <div className="hidden sm:block text-xs text-slate-500">
              Viewing: <span className="font-medium text-slate-700">{filterLabel}</span>
            </div>
          </div>
          <div className="sm:hidden text-xs text-slate-500">
            Viewing: <span className="font-medium text-slate-700">{filterLabel}</span>
          </div>
          {!viewer.region ? (
            <p className="text-xs text-slate-500">
              Set your region in your profile to see the regional leaderboard.
            </p>
          ) : null}
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-end">
            <Link href="/leaderboard/month" className="navlink w-full sm:w-auto text-center">
              Past Monthly Results
            </Link>
            <Link href="/leaderboard/year" className="navlink w-full sm:w-auto text-center">
              Past Yearly Results
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeaderboardTable title={`Rolling 12 months · ${scopedHeading}`} entries={rollingYear} />
        <LeaderboardTable title={`This month · ${scopedHeading}`} entries={rollingMonth} />
      </div>
    </div>
  );
}