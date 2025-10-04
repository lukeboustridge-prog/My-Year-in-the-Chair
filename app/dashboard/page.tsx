import { db } from "@/lib/db";

export default async function Dashboard() {
  const top = await db.user.findMany({ orderBy: { points: "desc" }, take: 5, select: { id: true, name: true, email: true, points: true } });
  const recent = await db.visit.findMany({ orderBy: { date: "desc" }, take: 5 });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="card">
          <h2 className="text-xl font-semibold mb-2">Top Masters</h2>
          <ol className="space-y-2">
            {top.map((u, idx) => (
              <li key={u.id} className="flex justify-between">
                <span>{idx + 1}. {u.name ?? u.email}</span>
                <span className="font-medium">{u.points} pts</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="card">
          <h2 className="text-xl font-semibold mb-2">Recent Visits</h2>
          <ul className="space-y-2">
            {recent.map(v => (
              <li key={v.id} className="flex justify-between">
                <span>{v.lodgeName} No. {v.lodgeNumber}</span>
                <span>{new Date(v.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
