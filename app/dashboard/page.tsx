export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

function getUserIdFromCookie(): string | null {
  const c = cookies().get("myyitc_session");
  if (!c) return null;
  try {
    const data = jwt.verify(c.value, process.env.JWT_SECRET || "");
    // @ts-ignore
    return data?.userId ?? null;
  } catch {
    return null;
  }
}

export default async function Page() {
  const userId = getUserIdFromCookie();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  let last12 = 0, thisMonth = 0;
  if (userId) {
    last12 = await db.visit.count({ where: { userId, date: { gte: yearAgo, lte: now } } });
    thisMonth = await db.visit.count({ where: { userId, date: { gte: monthStart, lte: now } } });
  }

  const recent = await db.visit.findMany({ orderBy: { date: "desc" }, take: 5 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-sm text-gray-500">Your rolling 12-month total</div>
          <div className="text-3xl font-bold">{userId ? last12 : "—"}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Your visits this month</div>
          <div className="text-3xl font-bold">{userId ? thisMonth : "—"}</div>
        </div>
      </div>

      <section className="card">
        <h2 className="text-xl font-semibold mb-2">Recent visits</h2>
        <ul className="space-y-2">
          {recent.map(v => (
            <li key={v.id} className="flex justify-between">
              <span>{v.lodgeName} No. {v.lodgeNumber}</span>
              <span>{new Date(v.date).toLocaleDateString()}</span>
            </li>
          ))}
          {recent.length === 0 && <li className="text-sm text-gray-500">No visits recorded yet.</li>}
        </ul>
      </section>
    </div>
  );
}
