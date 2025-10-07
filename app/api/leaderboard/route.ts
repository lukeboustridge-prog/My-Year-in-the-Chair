import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getVisitLeaderboard } from "@/lib/leaderboard";

export async function GET() {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });

  const [rollingYear, rollingMonth] = await Promise.all([
    getVisitLeaderboard("year"),
    getVisitLeaderboard("month"),
  ]);

  const findUser = (list: Awaited<ReturnType<typeof getVisitLeaderboard>>) =>
    list.find((entry) => entry.userId === uid) || null;

  return NextResponse.json({
    rollingYear: {
      leaders: rollingYear.slice(0, 10),
      user: findUser(rollingYear),
    },
    rollingMonth: {
      leaders: rollingMonth.slice(0, 10),
      user: findUser(rollingMonth),
    },
  });
}
