export const dynamic = "force-dynamic";

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
    <div className="card">
      <h2 style={{marginTop:0}}>{title}</h2>
      <div style={{overflowX:"auto"}}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Lodge</th>
              <th>Region</th>
              <th>Visits</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.user?.id || i}>
                <td>{i+1}</td>
                <td>{r.user?.name ?? "—"}</td>
                <td>{(r.user?.lodgeName || "—")}{r.user?.lodgeNumber ? ` (${r.user.lodgeNumber})` : ""}</td>
                <td>{r.user?.region || "—"}</td>
                <td><strong>{r.count}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="grid cols-2">
      <Table title="Rolling 12 Months" rows={sortedYear} />
      <Table title="This Month" rows={sortedMonth} />
    </div>
  );
}
