import { getVisitLeaderboard } from "@/lib/leaderboard";

export default async function LeaderboardPage() {
  const [rollingYear, rollingMonth] = await Promise.all([
    getVisitLeaderboard("year"),
    getVisitLeaderboard("month"),
  ]);

  const renderBody = (rows: Awaited<ReturnType<typeof getVisitLeaderboard>>) => {
    if (!rows.length) {
      return (
        <tr className="border-t">
          <td className="py-2 pr-3" colSpan={3}>No data yet.</td>
        </tr>
      );
    }
    return rows.slice(0, 20).map((row) => (
      <tr key={row.userId} className="border-t">
        <td className="py-2 pr-3">#{row.rank}</td>
        <td className="py-2 pr-3">{row.name}</td>
        <td className="py-2 pr-3">{row.visits}</td>
      </tr>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Leaderboard</h1>
        <span className="subtle">Rolling performance</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Rolling 12 Months</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">Rank</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Visits</th>
                  </tr>
                </thead>
                <tbody>{renderBody(rollingYear)}</tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Rolling Month</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">Rank</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Visits</th>
                  </tr>
                </thead>
                <tbody>{renderBody(rollingMonth)}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
