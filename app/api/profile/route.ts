// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { getUserRanks } from '@/lib/leaderboard';

const updateSchema = z.object({
  name: z.string().trim().max(120).optional(),
  rank: z.string().trim().max(120).optional(),
  isPastGrand: z.boolean().optional(),
  prefix: z.string().trim().max(60).optional(),
  postNominals: z.array(z.string().trim().max(60)).optional(),
  lodgeName: z.string().trim().max(160).optional(),
  lodgeNumber: z.string().trim().max(60).optional(),
  region: z.string().trim().max(120).optional(),
});

function normalisePostNominals(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v)).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

function defaultProfile() {
  return {
    userId: null as string | null,
    name: '',
    email: '',
    prefix: '',
    postNominals: [] as string[],
    rank: '',
    isPastGrand: false,
    lodgeName: '',
    lodgeNumber: '',
    region: '',
    termStart: null as string | null,
    termEnd: null as string | null,
    points: 0,
    rank12: undefined as number | undefined,
    points12: undefined as number | undefined,
    rankM: undefined as number | undefined,
    pointsM: undefined as number | undefined,
  };
}

function shapeResponse(user: any, ranks: any, userId: string) {
  const pn = normalisePostNominals(user?.postNominals);
  return {
    userId,
    name: user?.name ?? '',
    email: user?.email ?? '',
    prefix: user?.prefix ?? '',
    postNominals: pn,
    rank: user?.rank ?? '',
    isPastGrand: !!user?.isPastGrand,
    lodgeName: user?.lodgeName ?? '',
    lodgeNumber: user?.lodgeNumber ?? '',
    region: user?.region ?? '',
    termStart: user?.termStart instanceof Date ? user.termStart.toISOString() : user?.termStart ?? null,
    termEnd: user?.termEnd instanceof Date ? user.termEnd.toISOString() : user?.termEnd ?? null,
    points: typeof user?.points === 'number' ? user.points : 0,
    ...ranks,
  };
}

export async function GET(req: Request) {
  const prisma = getPrisma();
  const userId = getUserId(req);
  if (!prisma || !userId) {
    const fallback = defaultProfile();
    fallback.userId = userId ?? null;
    return NextResponse.json(fallback, { status: 200 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
  if (!user) {
    const fallback = defaultProfile();
    fallback.userId = userId;
    return NextResponse.json(fallback, { status: 200 });
  }

  const ranks = await getUserRanks(prisma, userId).catch(() => ({
    rank12: undefined,
    points12: undefined,
    rankM: undefined,
    pointsM: undefined,
  }));

  return NextResponse.json(shapeResponse(user, ranks, userId), { status: 200 });
}

export async function PUT(req: Request) {
  const prisma = getPrisma();
  const userId = getUserId(req);
  if (!prisma) return new NextResponse('Database unavailable', { status: 503 });
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  let json: any;
  try {
    json = await req.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return new NextResponse('Invalid input', { status: 400 });
  }

  const data = parsed.data;
  const update: Record<string, any> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.rank !== undefined) update.rank = data.rank;
  if (data.isPastGrand !== undefined) update.isPastGrand = data.isPastGrand;
  if (data.prefix !== undefined) update.prefix = data.prefix;
  if (data.postNominals !== undefined) update.postNominals = normalisePostNominals(data.postNominals);
  if (data.lodgeName !== undefined) update.lodgeName = data.lodgeName;
  if (data.lodgeNumber !== undefined) update.lodgeNumber = data.lodgeNumber;
  if (data.region !== undefined) update.region = data.region;

  if (Object.keys(update).length === 0) {
    return new NextResponse('No changes supplied', { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: update }).catch(() => null);
  if (!updated) {
    return new NextResponse('User not found', { status: 404 });
  }

  const ranks = await getUserRanks(prisma, userId).catch(() => ({
    rank12: undefined,
    points12: undefined,
    rankM: undefined,
    pointsM: undefined,
  }));

  return NextResponse.json(shapeResponse(updated, ranks, userId), { status: 200 });
}
