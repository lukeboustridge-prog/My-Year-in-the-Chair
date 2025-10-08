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

const WORK_LABELS: Record<string, string> = {
  INITIATION: "Initiation",
  PASSING: "Passing",
  RAISING: "Raising",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Other",
};

function formatWorkLabel(work: string | null | undefined) {
  if (!work) return "Other";
  return WORK_LABELS[work as keyof typeof WORK_LABELS] ?? work.replace(/_/g, " ");
}

export default async function DashboardPage() {
  const uid = getUserId();
  const user = uid ? await db.user.findUnique({ where: { id: uid } }) : null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(now.getFullYear() - 1);
  const termStartDate = user?.termStart ? new Date(user.termStart) : new Date(yearAgo);

  const [visits, mywork] = uid
    ? await Promise.all([
        db.visit.findMany({ where: { userId: uid }, orderBy: { date: "desc" } }),
        db.myWork.findMany({ where: { userId: uid }, orderBy: { date: "desc" } }),
      ])
    : [[], []];

  const rolling12 = visits.filter(v => v.date >= yearAgo).length;
  const thisMonth = visits.filter(v => v.date >= startOfMonth).length;

  const visitByWork = new Map<string, number>();
  for (const v of visits) {
    const k = (v.workOfEvening ?? "OTHER") as string;
    visitByWork.set(k, (visitByWork.get(k) || 0) + 1);
  }

  const myWorkByType = new Map<string, number>();
  for (const m of mywork) {
    const k = (m.work ?? "OTHER") as string;
    myWorkByType.set(k, (myWorkByType.get(k) || 0) + 1);
  }

  const visitByWorkEntries = Array.from(visitByWork.entries());
  const myWorkEntries = Array.from(myWorkByType.entries());

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
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-slate-900">Visits by work of the evening</h2>
            {visitByWorkEntries.length ? (
              <ul className="mt-4 space-y-2 text-sm">
                {visitByWorkEntries.map(([work, count]) => (
                  <li key={work} className="flex items-center justify-between">
                    <span>{formatWorkLabel(work)}</span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No visits recorded yet.</p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-slate-900">My Lodge Work by type</h2>
            {myWorkEntries.length ? (
              <ul className="mt-4 space-y-2 text-sm">
                {myWorkEntries.map(([work, count]) => (
                  <li key={work} className="flex items-center justify-between">
                    <span>{formatWorkLabel(work)}</span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No lodge work planned yet.</p>
            )}
          </div>
        </div>
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
