export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import {
  fetchUsersById,
  formatDisplayName as formatLeaderboardName,
  formatLodge,
  formatPostNominals,
  type LeaderboardUser,
} from "@/lib/leaderboard";

function displayName(user: any) {
  const parts: string[] = [];
  if (user?.prefix) parts.push(user.prefix);
  if (user?.name) parts.push(user.name);
  const pn = user?.postNominals ?? [];
  if (pn.length) parts[parts.length-1] = parts[parts.length-1] + " " + pn.join(", ");
  return parts.join(" ");
}

type LeaderboardEntry = {
  rank: number;
  count: number;
  user: LeaderboardUser | undefined;
};

async function getVisitLeaderboard(since: Date, limit = 5): Promise<LeaderboardEntry[]> {
  const grouped = await db.visit.groupBy({
    by: ["userId"],
    where: { date: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { userId: "desc" } },
    take: limit,
  });

  if (!grouped.length) return [];

  const users = await fetchUsersById(grouped.map((row) => row.userId));

  return grouped.map((row, index) => ({
    rank: index + 1,
    count: row._count._all,
    user: users.get(row.userId),
  }));
}

function LeaderboardSummary({ title, entries }: { title: string; entries: LeaderboardEntry[] }) {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3">Rank</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Lodge</th>
                <th className="py-2 pr-3 text-right">Visits</th>
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
                  const post = formatPostNominals(entry.user);
                  return (
                    <tr key={entry.user?.id ?? entry.rank} className="border-t">
                      <td className="py-2 pr-3">{entry.rank}</td>
                      <td className="py-2 pr-3">
                        <div className="font-medium">{formatLeaderboardName(entry.user)}</div>
                        {post ? <div className="text-xs text-slate-500">{post}</div> : null}
                      </td>
                      <td className="py-2 pr-3 text-sm">
                        {formatLodge(entry.user) || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-2 pl-3 text-right font-semibold text-slate-900">{entry.count}</td>
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

export default async function DashboardPage() {
  const uid = getUserId();
  const user = uid ? await db.user.findUnique({ where: { id: uid } }) : null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(now.getFullYear() - 1);
  const termStartDate = user?.termStart ? new Date(user.termStart) : new Date(yearAgo);

  type VisitsResult = Awaited<ReturnType<typeof db.visit.findMany>>;
  let visits: VisitsResult = [];
  let rollingYearLeaders: LeaderboardEntry[] = [];
  let rollingMonthLeaders: LeaderboardEntry[] = [];

  if (uid) {
    [visits, rollingYearLeaders, rollingMonthLeaders] = await Promise.all([
      db.visit.findMany({ where: { userId: uid }, orderBy: { date: "desc" } }),
      getVisitLeaderboard(new Date(yearAgo), 5),
      getVisitLeaderboard(startOfMonth, 5),
    ]);
  }

  const rolling12 = visits.filter((v) => v.date >= yearAgo).length;
  const thisMonth = visits.filter((v) => v.date >= startOfMonth).length;

  const statCards = [
    {
      label: "Term start",
      value: termStartDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    },
    {
      label: "Today",
      value: now.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    },
    { label: "Visits (rolling 12 months)", value: rolling12.toString() },
    { label: "Visits (this month)", value: thisMonth.toString() },
  ];

  const welcomeName = user ? displayName(user) : null;

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="card-body flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Welcome back</p>
            <h1 className="h1 mt-1">{welcomeName ?? "Master"}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {user?.rank ? (
                <span className="badge">
                  {user.isPastGrand && user.rank ? `Past ${user.rank}` : user.rank}
                </span>
              ) : null}
              {user?.lodgeName ? (
                <span>
                  Lodge: {user.lodgeName}
                  {user.lodgeNumber ? ` (${user.lodgeNumber})` : ""}
                  {user.region ? ` • ${user.region}` : ""}
                </span>
              ) : null}
            </div>
          </div>
          <a className="btn-primary" href="/profile">
            Edit profile
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className="card-body">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <LeaderboardSummary title="Rolling 12 months" entries={rollingYearLeaders} />
        <LeaderboardSummary title="This month" entries={rollingMonthLeaders} />
      </section>

      <section className="card">
        <div className="card-body flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Export</h2>
            <p className="text-sm text-slate-500">
              Download a CSV summary of your term for the Grand Superintendent or Region.
            </p>
          </div>
          <a className="btn-primary" href="/api/reports/term">
            Download CSV
          </a>
        </div>
      </section>
    </div>
  );
}
