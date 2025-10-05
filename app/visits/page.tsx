export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import Link from "next/link";

export default async function Page() {
  const visits = await db.visit.findMany({ orderBy: { date: "desc" } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Visits</h1>
        <Link href="/visits/new" className="btn btn-primary">Log a visit</Link>
      </div>
      <div className="card divide-y divide-gray-200 dark:divide-gray-800">
        {visits.map(v => (
          <div key={v.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{v.lodgeName} No. {v.lodgeNumber}</div>
              <div className="text-sm text-gray-500">{new Date(v.date).toLocaleString()} {v.location ? " • " + v.location : ""}</div>
            </div>
            <div className="text-sm">{v.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
