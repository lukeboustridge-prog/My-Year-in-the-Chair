export const dynamic = "force-dynamic";

import { db } from "@/lib/db";

export default async function Page() {
  const users = await db.user.findMany({ orderBy: { points: "desc" }, take: 50, select: { id: true, name: true, email: true, points: true } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Visitor leaderboard</h1>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500">
              <th className="py-2">Rank</th><th>Name</th><th>Points</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className="border-t border-gray-200 dark:border-gray-800">
                <td className="py-2">{i+1}</td>
                <td>{u.name ?? u.email}</td>
                <td className="font-medium">{u.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
