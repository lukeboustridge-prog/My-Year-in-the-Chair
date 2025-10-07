import { getVisitLeaderboard } from "@/lib/leaderboard";

export default async function LeaderboardPage() {
  const [rollingYear, rollingMonth] = await Promise.all([
    getVisitLeaderboard("year"),
    getVisitLeaderboard("month"),
  ]);

  const renderTableBody = (rows: Awaited<ReturnType<typeof getVisitLeaderboard>>) => {
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="h1">Leaderboard</h1>
        <span className="subtle">Rolling performance</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-body space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold">Rolling 12 Months</h2>
            </div>
            {rollingYear.length === 0 ? (
              <div className="subtle">No data yet.</div>
            ) : (
              <>
                <div className="space-y-3 sm:hidden">
                  {rollingYear.slice(0, 20).map((row) => (
                    <div
                      key={row.userId}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-500">Rank</div>
                          <div className="text-lg font-semibold">#{row.rank}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs uppercase tracking-wide text-slate-500">Visits</div>
                          <div className="text-lg font-semibold">{row.visits}</div>
                        </div>
                      </div>
                      <div className="mt-3 text-sm font-medium text-slate-700">{row.name}</div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-2 pr-3">Rank</th>
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">Visits</th>
                      </tr>
                    </thead>
                    <tbody>{renderTableBody(rollingYear)}</tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold">Rolling Month</h2>
            </div>
            {rollingMonth.length === 0 ? (
              <div className="subtle">No data yet.</div>
            ) : (
              <>
                <div className="space-y-3 sm:hidden">
                  {rollingMonth.slice(0, 20).map((row) => (
                    <div
                      key={row.userId}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-500">Rank</div>
                          <div className="text-lg font-semibold">#{row.rank}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs uppercase tracking-wide text-slate-500">Visits</div>
                          <div className="text-lg font-semibold">{row.visits}</div>
                        </div>
                      </div>
                      <div className="mt-3 text-sm font-medium text-slate-700">{row.name}</div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-2 pr-3">Rank</th>
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">Visits</th>
                      </tr>
                    </thead>
                    <tbody>{renderTableBody(rollingMonth)}</tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
