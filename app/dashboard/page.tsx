export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function displayName(user: any) {
  const parts: string[] = [];
  if (user?.prefix) parts.push(user.prefix);
  if (user?.name) parts.push(user.name);
  const pn = user?.postNominals ?? [];
  if (pn.length) parts[parts.length-1] = parts[parts.length-1] + " " + pn.join(", ");
  return parts.join(" ");
}

type RankSummary = {
  rank: number | null;
  total: number;
  count: number;
};

async function getUserRank(userId: string, since: Date): Promise<RankSummary> {
  const grouped = await db.visit.groupBy({
    by: ["userId"],
    where: { date: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { userId: "desc" } },
  });

  if (!grouped.length) {
    return { rank: null, total: 0, count: 0 };
  }

  const index = grouped.findIndex((row) => row.userId === userId);
  if (index === -1) {
    return { rank: null, total: grouped.length, count: 0 };
  }

  return {
    rank: index + 1,
    total: grouped.length,
    count: grouped[index]._count._all,
  };
}

function formatOrdinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  const mod10 = value % 10;
  if (mod10 === 1) return `${value}st`;
  if (mod10 === 2) return `${value}nd`;
  if (mod10 === 3) return `${value}rd`;
  return `${value}th`;
}

function RankCard({ label, summary }: { label: string; summary: RankSummary | null }) {
  const details = summary ?? null;
  const hasData = Boolean(details && details.total > 0);
  const rankLabel = details?.rank ? formatOrdinal(details.rank) : hasData ? "Unranked" : "No visits yet";
  const visitCount = details?.count ?? 0;
  const visitText = `${visitCount} visit${visitCount === 1 ? "" : "s"}`;
  const cohortText = hasData
    ? details?.rank
      ? `out of ${details.total}`
      : `from ${details?.total ?? 0} lodges`
    : "Record visits to see your rank";

  return (
    <div className="card">
      <div className="card-body">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{rankLabel}</p>
        <p className="mt-2 text-sm text-slate-600">
          {hasData ? (
            <>
              {visitText}
              {details?.rank ? <span className="ml-1 text-slate-500">{cohortText}</span> : null}
            </>
          ) : (
            cohortText
          )}
        </p>
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

  type VisitsResult = Awaited<ReturnType<typeof db.visit.findMany>>;
  let visits: VisitsResult = [];
  let rollingYearRank: RankSummary | null = null;
  let rollingMonthRank: RankSummary | null = null;

  if (uid) {
    [visits, rollingYearRank, rollingMonthRank] = await Promise.all([
      db.visit.findMany({ where: { userId: uid }, orderBy: { date: "desc" } }),
      getUserRank(uid, new Date(yearAgo)),
      getUserRank(uid, startOfMonth),
    ]);
  }

  const rolling12 = visits.filter((v) => v.date >= yearAgo).length;
  const thisMonth = visits.filter((v) => v.date >= startOfMonth).length;

  const statCards = [
    { label: "Visits (rolling 12 months)", value: rolling12.toString() },
    { label: "Visits (this month)", value: thisMonth.toString() },
  ];

  const rankCards = [
    { label: "Rolling 12 months", summary: rollingYearRank },
    { label: "This month", summary: rollingMonthRank },
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

      <section className="grid gap-4 md:grid-cols-2">
        {rankCards.map((card) => (
          <RankCard key={card.label} label={`My rank (${card.label})`} summary={card.summary} />
        ))}
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
