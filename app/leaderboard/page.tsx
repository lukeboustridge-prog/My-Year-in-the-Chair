import { db } from "@/lib/db";

export default async function LeaderboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now); yearAgo.setFullYear(now.getFullYear() - 1);

  const year = await db.visit.groupBy({
    by: ["userId"],
    where: { date: { gte: yearAgo, lte: now } },
    _count: { _all: true },
  });
  const month = await db.visit.groupBy({
    by: ["userId"],
    where: { date: { gte: startOfMonth, lte: now } },
    _count: { _all: true },
  });

  const ids = Array.from(new Set([...year.map(x=>x.userId), ...month.map(x=>x.userId)]));
  const users = await db.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, lodgeName: true, lodgeNumber: true, region: true },
  });
  const map = new Map(users.map(u=>[u.id,u]));

  const sortedYear = year
    .map(x=>({ user: map.get(x.userId), count: x._count._all }))
    .sort((a,b)=> b.count - a.count);

  const sortedMonth = month
    .map(x=>({ user: map.get(x.userId), count: x._count._all }))
    .sort((a,b)=> b.count - a.count);

  const Table = ({ title, rows }: { title: string; rows: any[] }) => (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Lodge</th>
              <th className="py-2 pr-3">Region</th>
              <th className="py-2 pr-3">Visits</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.user?.id || i} className="border-b">
                <td className="py-2 pr-3">{i+1}</td>
                <td className="py-2 pr-3">{r.user?.name ?? "—"}</td>
                <td className="py-2 pr-3">
                  {(r.user?.lodgeName || "—")}{r.user?.lodgeNumber ? ` (${r.user.lodgeNumber})` : ""}
                </td>
                <td className="py-2 pr-3">{r.user?.region || "—"}</td>
                <td className="py-2 pr-3 font-semibold">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Leaderboards</h1>
      <Table title="Rolling 12 Months" rows={sortedYear} />
      <Table title="This Month" rows={sortedMonth} />
    </div>
  );
}
