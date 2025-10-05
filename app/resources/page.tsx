export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import Link from "next/link";

export default async function Page() {
  const resources = await db.resource.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Master’s resources</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {resources.map(r => (
          <div key={r.id} className="card">
            <div className="font-semibold">{r.title}</div>
            <p className="text-sm text-gray-500">{r.summary}</p>
            {r.url && <Link href={r.url} className="link mt-2 inline-block" target="_blank">Open resource</Link>}
          </div>
        ))}
        {resources.length === 0 && <p className="text-sm text-gray-500">No resources yet.</p>}
      </div>
    </div>
  );
}
