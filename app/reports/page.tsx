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
  const total = visits.length;

  const byWork = new Map<string, number>();
  const byRegion = new Map<string, number>();
  for (const v of visits) {
    byWork.set(v.workOfEvening, (byWork.get(v.workOfEvening) || 0) + 1);
    const region = v.region ?? "—";
    byRegion.set(region, (byRegion.get(region) || 0) + 1);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Summary report</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-gray-500">Term start</div>
          <div className="text-xl font-semibold">{start.toDateString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Today</div>
          <div className="text-xl font-semibold">{now.toDateString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Total visits</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <section className="card">
          <h2 className="text-lg font-semibold mb-2">By work of the evening</h2>
          <ul className="space-y-1">
            {Array.from(byWork.entries()).map(([k,n]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="font-medium">{n}</span></li>
            ))}
            {byWork.size === 0 && <li className="text-sm text-gray-500">No data yet.</li>}
          </ul>
        </section>
        <section className="card">
          <h2 className="text-lg font-semibold mb-2">By region</h2>
          <ul className="space-y-1">
            {Array.from(byRegion.entries()).map(([k,n]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="font-medium">{n}</span></li>
            ))}
            {byRegion.size === 0 && <li className="text-sm text-gray-500">No data yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
