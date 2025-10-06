import type { PrismaClient } from '@prisma/client';

export type LeaderboardPeriod = '12mo' | 'month' | 'all';

export type LeaderboardRow = {
  userId: string;
  name: string;
  email?: string | null;
  visits: number;
  workings: number;
  points: number;
  rank: number;
  month?: string;
  year?: number;
};

function computeWindow(period: LeaderboardPeriod): { start?: Date; end: Date } {
  const end = new Date();
  if (period === 'month') {
    return { start: new Date(end.getFullYear(), end.getMonth(), 1), end };
  }
  if (period === '12mo') {
    const start = new Date(end);
    start.setFullYear(start.getFullYear() - 1);
    return { start, end };
  }
  return { end };
}

function buildDisplayName(user: any): string {
  if (!user) return 'Unknown';
  const parts: string[] = [];
  if (user.prefix) parts.push(String(user.prefix));
  if (user.name) parts.push(String(user.name));
  const pn = Array.isArray(user.postNominals)
    ? user.postNominals
    : typeof user.postNominals === 'string'
      ? String(user.postNominals).split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
  if (pn.length) {
    if (parts.length === 0) parts.push('');
    const last = parts.pop() ?? '';
    parts.push(`${last} ${pn.join(', ')}`.trim());
  }
  if (parts.length === 0 && user.email) parts.push(String(user.email));
  return parts.join(' ') || 'Unknown';
}

export async function buildLeaderboard(prisma: PrismaClient, period: LeaderboardPeriod = '12mo'): Promise<LeaderboardRow[]> {
  const { start, end } = computeWindow(period);
  const visitWhere = start ? { date: { gte: start, lte: end } } : {};
  const workWhere = start ? { date: { gte: start, lte: end } } : {};

  const visitPromise = prisma.visit?.groupBy
    ? prisma.visit.groupBy({ by: ['userId'], where: visitWhere, _count: { _all: true } })
    : Promise.resolve([]);
  const workPromise = prisma.myWork?.groupBy
    ? prisma.myWork.groupBy({ by: ['userId'], where: workWhere, _count: { _all: true } })
    : Promise.resolve([]);

  const [visitGroupsRaw, workGroupsRaw] = await Promise.all([
    visitPromise.catch(() => []),
    workPromise.catch(() => []),
  ]);

  const visitGroups = visitGroupsRaw as any[];
  const workGroups = workGroupsRaw as any[];

  const counts = new Map<string, { visits: number; workings: number }>();
  for (const g of visitGroups) {
    if (!g?.userId) continue;
    const curr = counts.get(g.userId) || { visits: 0, workings: 0 };
    curr.visits += g._count?._all ?? 0;
    counts.set(g.userId, curr);
  }
  for (const g of workGroups) {
    if (!g?.userId) continue;
    const curr = counts.get(g.userId) || { visits: 0, workings: 0 };
    curr.workings += g._count?._all ?? 0;
    counts.set(g.userId, curr);
  }

  const ids = Array.from(counts.keys());
  if (ids.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      email: true,
      prefix: true,
      postNominals: true,
      points: true,
    },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  const rows = ids.map(userId => {
    const user = userMap.get(userId) ?? null;
    const tally = counts.get(userId)!;
    const basePoints = typeof user?.points === 'number' && !Number.isNaN(user.points) ? Number(user.points) : null;
    const points = basePoints !== null ? basePoints : tally.visits + tally.workings;
    const row: LeaderboardRow = {
      userId,
      name: buildDisplayName(user),
      email: user?.email ?? null,
      visits: tally.visits,
      workings: tally.workings,
      points,
      rank: 0,
      month: period === 'month' ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}` : undefined,
      year: period === '12mo' ? end.getFullYear() : undefined,
    };
    return row;
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.visits !== a.visits) return b.visits - a.visits;
    if (b.workings !== a.workings) return b.workings - a.workings;
    return a.name.localeCompare(b.name);
  });

  let lastPoints: number | null = null;
  let lastVisits: number | null = null;
  let lastWorkings: number | null = null;
  let lastRank = 0;
  rows.forEach((row, index) => {
    const position = index + 1;
    if (row.points === lastPoints && row.visits === lastVisits && row.workings === lastWorkings) {
      row.rank = lastRank;
    } else {
      row.rank = position;
      lastRank = position;
      lastPoints = row.points;
      lastVisits = row.visits;
      lastWorkings = row.workings;
    }
  });

  return rows;
}

export async function getUserRanks(prisma: PrismaClient, userId: string) {
  const [twelve, month] = await Promise.all([
    buildLeaderboard(prisma, '12mo'),
    buildLeaderboard(prisma, 'month'),
  ]);
  const row12 = twelve.find(r => r.userId === userId) || null;
  const rowM = month.find(r => r.userId === userId) || null;
  return {
    rank12: row12?.rank,
    points12: row12?.points,
    rankM: rowM?.rank,
    pointsM: rowM?.points,
  };
}
