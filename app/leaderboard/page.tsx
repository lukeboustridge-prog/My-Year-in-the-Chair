export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Leaderboard</h1>
        <span className="subtle">Rolling performance</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rolling 12 Months */}
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
                    <th className="py-2 pr-3">Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Rolling Month */}
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
                    <th className="py-2 pr-3">Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}