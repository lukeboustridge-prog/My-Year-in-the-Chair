export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export default async function ReportsSummaryPage() {
  const userId = getUserId();
  if (!userId) return <div className="card">Please sign in to view your summary.</div>;

  const user = await db.user.findUnique({ where: { id: userId } });
  const now = new Date();
  const start = user?.termStart ?? new Date(now.getFullYear()-1, now.getMonth(), now.getDate());

  const visits = await db.visit.findMany({ where: { userId, date: { gte: start, lte: now } }, orderBy: { date: "asc" } });
  const mywork = await db.myWork.findMany({ where: { userId, date: { gte: start, lte: now } }, orderBy: { date: "asc" } });

  const totalVisits = visits.length;
  const totalMyWork = mywork.length;

  const byWorkVisit = new Map<string, number>();
  for (const v of visits) byWorkVisit.set(v.workOfEvening, (byWorkVisit.get(v.workOfEvening) || 0) + 1);

  const byWorkMy = new Map<string, number>();
  for (const m of mywork) byWorkMy.set(m.work, (byWorkMy.get(m.work) || 0) + 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Summary report</h1>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-500">Term start</div>
          <div className="text-xl font-semibold">{start.toDateString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Today</div>
          <div className="text-xl font-semibold">{now.toDateString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Visits logged</div>
          <div className="text-2xl font-bold">{totalVisits}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">My Lodge Work</div>
          <div className="text-2xl font-bold">{totalMyWork}</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <section className="card">
          <h2 className="text-lg font-semibold mb-2">Visits by work of the evening</h2>
          <ul className="space-y-1">
            {Array.from(byWorkVisit.entries()).map(([k,n]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="font-medium">{n}</span></li>
            ))}
            {byWorkVisit.size === 0 && <li className="text-sm text-gray-500">No data yet.</li>}
          </ul>
        </section>
        <section className="card">
          <h2 className="text-lg font-semibold mb-2">My Lodge Work by type</h2>
          <ul className="space-y-1">
            {Array.from(byWorkMy.entries()).map(([k,n]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="font-medium">{n}</span></li>
            ))}
            {byWorkMy.size === 0 && <li className="text-sm text-gray-500">No data yet.</li>}
          </ul>
        </section>
      </div>

      <a href="/api/reports/term" className="btn btn-primary inline-block">Download CSV report</a>
    </div>
  );
}
