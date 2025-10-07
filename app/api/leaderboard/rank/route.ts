import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";

type GroupResult = {
  userId: string;
  _count: { _all: number };
};

type RankResult = {
  rank: number | null;
  visits: number;
};

function computeRank(groups: GroupResult[], userId: string): RankResult {
  const sorted = [...groups].sort((a, b) => b._count._all - a._count._all);
  const index = sorted.findIndex((group) => group.userId === userId);
  if (index === -1) {
    return { rank: null, visits: 0 };
  }
  return { rank: index + 1, visits: sorted[index]._count._all };
}

export async function GET() {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const [monthGroups, yearGroups] = await Promise.all([
    db.visit.groupBy({
      by: ["userId"],
      where: { date: { gte: monthStart, lte: now } },
      _count: { _all: true },
    }),
    db.visit.groupBy({
      by: ["userId"],
      where: { date: { gte: yearAgo, lte: now } },
      _count: { _all: true },
    }),
  ]);

  const month = computeRank(monthGroups as GroupResult[], uid);
  const year = computeRank(yearGroups as GroupResult[], uid);

  return NextResponse.json({
    monthRank: month.rank,
    monthVisits: month.visits,
    yearRank: year.rank,
    yearVisits: year.visits,
  });
}
