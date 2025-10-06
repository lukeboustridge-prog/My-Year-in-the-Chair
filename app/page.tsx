export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Dashboard</h1>
        <span className="subtle">Welcome back</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Total Visits</div>
          <div className="text-2xl font-semibold">—</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Offices Held</div>
          <div className="text-2xl font-semibold">—</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Leaderboard Rank</div>
          <div className="text-2xl font-semibold">—</div>
        </div></div>
      </div>
    </div>
  );
}