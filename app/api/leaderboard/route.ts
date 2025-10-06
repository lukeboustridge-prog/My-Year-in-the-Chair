import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { buildLeaderboard, type LeaderboardPeriod } from '@/lib/leaderboard';

function resolvePeriod(input: string | null): LeaderboardPeriod {
  if (!input) return '12mo';
  const normalised = input.toLowerCase();
  if (normalised === 'month') return 'month';
  if (normalised === 'all' || normalised === 'lifetime') return 'all';
  return '12mo';
}

export async function GET(req: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json([], { status: 200 });
  }

  const url = new URL(req.url, 'http://localhost');
  const period = resolvePeriod(url.searchParams.get('period'));

  try {
    const rows = await buildLeaderboard(prisma, period);
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error('leaderboard_error', err);
    return NextResponse.json([], { status: 200 });
  }
}
