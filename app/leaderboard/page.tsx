export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";

type LeaderboardRow = {
  id: string;
  count: number;
  user?: {
    name: string | null;
    email: string | null;
    lodgeName: string | null;
    lodgeNumber: string | null;
    region: string | null;
  };
};

type LeaderboardRange = "month" | "year";

async function getLeaderboard(range: LeaderboardRange): Promise<LeaderboardRow[]> {
  const now = new Date();
  let start: Date;
  if (range === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
  }

  const grouped = await db.visit.groupBy({
    by: ["userId"],
    where: { date: { gte: start, lte: now } },
    _count: { _all: true },
  });

  const ids = grouped.map((group) => group.userId);
  const users = await db.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      email: true,
      lodgeName: true,
      lodgeNumber: true,
      region: true,
    },
  });

  const byId = new Map(users.map((user) => [user.id, user]));

  return grouped
    .map((group) => ({
      id: group.userId,
      count: group._count._all,
      user: byId.get(group.userId),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function formatLodge(row: LeaderboardRow) {
  const { lodgeName, lodgeNumber } = row.user ?? {};
  if (!lodgeName && !lodgeNumber) return "—";
  return [
    lodgeName ?? "",
    lodgeNumber ? `No. ${lodgeNumber}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function formatName(row: LeaderboardRow) {
  const { name, email } = row.user ?? {};
  return name || email || "Unknown";
}

type TableProps = {
  title: string;
  rows: LeaderboardRow[];
  emptyCopy: string;
  viewAllHref: string;
};

function LeaderboardTable({ title, rows, emptyCopy, viewAllHref }: TableProps) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{title}</h2>
          <Link href={viewAllHref} className="navlink">
            View full board
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3">Rank</th>
                <th className="py-2 pr-3">Master</th>
                <th className="py-2 pr-3">Lodge</th>
                <th className="py-2 pr-3">Region</th>
                <th className="py-2 pr-3">Visits</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="border-t">
                  <td className="py-2 pr-3" colSpan={5}>
                    <span className="subtle">{emptyCopy}</span>
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-2 pr-3">{index + 1}</td>
                    <td className="py-2 pr-3">{formatName(row)}</td>
                    <td className="py-2 pr-3">{formatLodge(row)}</td>
                    <td className="py-2 pr-3">{row.user?.region ?? "—"}</td>
                    <td className="py-2 pr-3 font-medium">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default async function LeaderboardPage() {
  const [yearRows, monthRows] = await Promise.all([
    getLeaderboard("year"),
    getLeaderboard("month"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Leaderboard</h1>
        <span className="subtle">Rolling performance</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeaderboardTable
          title="Rolling 12 Months"
          rows={yearRows}
          emptyCopy="No visits recorded in the last 12 months."
          viewAllHref="/leaderboard/year"
        />
        <LeaderboardTable
          title="Rolling Month"
          rows={monthRows}
          emptyCopy="No visits recorded this month."
          viewAllHref="/leaderboard/month"
        />
      </div>
    </div>
  );
}
