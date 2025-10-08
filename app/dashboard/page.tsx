export const dynamic = "force-dynamic";

import { WorkType } from "@prisma/client";

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

const WORK_LABELS: Record<WorkType, string> = {
  INITIATION: "Initiation",
  PASSING: "Passing",
  RAISING: "Raising",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Other",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

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

function formatWork(value: WorkType | null | undefined): string {
  if (!value) return WORK_LABELS.OTHER;
  return (
    WORK_LABELS[value] ?? value.charAt(0) + value.slice(1).toLowerCase()
  );
}

function formatListDate(date: Date | null | undefined): string {
  if (!date) return "—";
  try {
    return DATE_FORMATTER.format(date);
  } catch {
    return new Date(date).toLocaleDateString("en-GB");
  }
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

  type VisitSummary = {
    id: string;
    date: Date;
    lodgeName: string | null;
    lodgeNumber: string | null;
    workOfEvening: WorkType | null;
    candidateName: string | null;
  };

  type WorkSummary = {
    id: string;
    date: Date;
    work: WorkType;
    candidateName: string | null;
  };

  let rollingYearRank: RankSummary | null = null;
  let rollingMonthRank: RankSummary | null = null;
  let recentVisits: VisitSummary[] = [];
  let recentWorkings: WorkSummary[] = [];

  if (uid) {
    [
      rollingYearRank,
      rollingMonthRank,
      recentVisits,
      recentWorkings,
    ] = await Promise.all([
      getUserRank(uid, new Date(yearAgo)),
      getUserRank(uid, startOfMonth),
      db.visit.findMany({
        where: { userId: uid },
        orderBy: { date: "desc" },
        take: 5,
        select: {
          id: true,
          date: true,
          lodgeName: true,
          lodgeNumber: true,
          workOfEvening: true,
          candidateName: true,
        },
      }),
      db.myWork.findMany({
        where: { userId: uid },
        orderBy: { date: "desc" },
        take: 5,
        select: {
          id: true,
          date: true,
          work: true,
          candidateName: true,
        },
      }),
    ]);
  }

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

      <section className="grid gap-4 md:grid-cols-2">
        {rankCards.map((card) => (
          <RankCard key={card.label} label={`My rank (${card.label})`} summary={card.summary} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent visits</h2>
                <p className="text-sm text-slate-500">Your latest five visits at a glance.</p>
              </div>
              <a className="btn-soft" href="/visits">
                Manage visits
              </a>
            </div>
            <div className="mt-4 divide-y divide-slate-200">
              {recentVisits.length ? (
                recentVisits.map((visit) => {
                  const lodgeDisplay = [
                    visit.lodgeName ?? "",
                    visit.lodgeNumber ? `No. ${visit.lodgeNumber}` : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={visit.id}
                      className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{lodgeDisplay || "Visit"}</p>
                        <p className="text-sm text-slate-500">
                          {formatListDate(visit.date)} • {formatWork(visit.workOfEvening)}
                        </p>
                      </div>
                      {visit.candidateName ? (
                        <p className="text-sm text-slate-600 sm:text-right">{visit.candidateName}</p>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="py-3 text-sm text-slate-500">Record a visit to see it appear here.</p>
              )}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent lodge workings</h2>
                <p className="text-sm text-slate-500">Track the last five workings you recorded.</p>
              </div>
              <a className="btn-soft" href="/workings">
                Manage workings
              </a>
            </div>
            <div className="mt-4 divide-y divide-slate-200">
              {recentWorkings.length ? (
                recentWorkings.map((work) => (
                  <div
                    key={work.id}
                    className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{formatWork(work.work)}</p>
                      <p className="text-sm text-slate-500">{formatListDate(work.date)}</p>
                    </div>
                    {work.candidateName ? (
                      <p className="text-sm text-slate-600 sm:text-right">{work.candidateName}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="py-3 text-sm text-slate-500">Add a working to start building your history.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
