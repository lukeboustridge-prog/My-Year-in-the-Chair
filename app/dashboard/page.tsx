export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function formatDisplayName(user: any) {
  const parts: string[] = [];
  if (user?.prefix) parts.push(user.prefix);
  if (user?.name) parts.push(user.name);
  const pn = [...(user?.postNominals ?? []), ...(user?.grandPostNominals ?? [])];
  if (pn.length) parts[parts.length-1] = parts[parts.length-1] + " " + pn.join(", ");
  return parts.join(" ");
}

export default async function DashboardPage() {
  const userId = getUserId();
  const user = userId ? await db.user.findUnique({ where: { id: userId } }) : null;

  const now = new Date();
  const termStart = user?.termStart ?? new Date(now.getFullYear()-1, now.getMonth(), now.getDate());

  const visits = userId ? await db.visit.findMany({ where: { userId, date: { gte: termStart, lte: now } }, orderBy: { date: "asc" } }) : [];
  const mywork = userId ? await db.myWork.findMany({ where: { userId, date: { gte: termStart, lte: now } }, orderBy: { date: "asc" } }) : [];

  const totalVisits = visits.length;
  const totalMyWork = mywork.length;

  const byWorkVisit = new Map<string, number>();
  for (const v of visits) byWorkVisit.set(v.workOfEvening ?? "OTHER", (byWorkVisit.get(v.workOfEvening ?? "OTHER") || 0) + 1);

  const byWorkMy = new Map<string, number>();
  for (const m of mywork) byWorkMy.set(m.work ?? "OTHER", (byWorkMy.get(m.work ?? "OTHER") || 0) + 1);

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-semibold">Welcome{user ? `, ${formatDisplayName(user)}` : ""}</h1>
        {user?.grandRank && <div className="text-sm opacity-80 mt-1">Grand Rank: {user.grandRank}</div>}
        {user?.lodgeName && (
          <div className="text-sm opacity-80">Lodge: {user.lodgeName}{user.lodgeNumber ? ` (${user.lodgeNumber})` : ""}{user.region ? ` • ${user.region}` : ""}</div>
        )}
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="card"><div className="text-sm text-gray-400">Term start</div><div className="text-xl font-semibold">{termStart.toDateString()}</div></div>
        <div className="card"><div className="text-sm text-gray-400">Today</div><div className="text-xl font-semibold">{now.toDateString()}</div></div>
        <div className="card"><div className="text-sm text-gray-400">Visits logged</div><div className="text-2xl font-bold">{totalVisits}</div></div>
        <div className="card"><div className="text-sm text-gray-400">My Lodge Work</div><div className="text-2xl font-bold">{totalMyWork}</div></div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <section className="card">
          <h2 className="text-lg font-semibold mb-2">Visits by work of the evening</h2>
          <ul className="space-y-1">
            {Array.from(byWorkVisit.entries()).map(([k,n]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="font-medium">{n}</span></li>
            ))}
            {byWorkVisit.size === 0 && <li className="text-sm text-gray-400">No data yet.</li>}
          </ul>
        </section>
        <section className="card">
          <h2 className="text-lg font-semibold mb-2">My Lodge Work by type</h2>
          <ul className="space-y-1">
            {Array.from(byWorkMy.entries()).map(([k,n]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="font-medium">{n}</span></li>
            ))}
            {byWorkMy.size === 0 && <li className="text-sm text-gray-400">No data yet.</li>}
          </ul>
        </section>
      </div>

      <div>
        <a className="btn btn-primary inline-block" href="/api/reports/term">Download CSV report</a>
      </div>
    </div>
  );
}
