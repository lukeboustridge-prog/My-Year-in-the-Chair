// app/api/workings/route.ts
import { NextResponse } from 'next/server';
import { getPrisma, memStore } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { parseDate, stringOrNull } from '../visits/helpers';

function serialize(row: any) {
  const dateIso = row.date instanceof Date ? row.date.toISOString() : new Date(row.date).toISOString();
  const createdAt = row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt ?? null;
  const updatedAt = row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt ?? null;
  return {
    id: row.id,
    userId: row.userId ?? null,
    title: row.title ?? '',
    date: dateIso,
    lodgeName: row.lodgeName ?? null,
    lodgeNumber: row.lodgeNumber ?? null,
    notes: row.notes ?? null,
    createdBy: row.createdBy ?? null,
    grandLodgeVisit: Boolean(row.grandLodgeVisit),
    emergencyMeeting: Boolean(row.emergencyMeeting),
    createdAt,
    updatedAt,
  };
}

export async function GET(req: Request) {
  const uid = getUserId(req);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const prisma = getPrisma();
  if (prisma) {
    const rows = await prisma.lodgeWork.findMany({
      where: { userId: uid },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(rows.map(serialize));
  }
  // fallback for local/dev without DB
  return NextResponse.json(memStore.list());
}

export async function POST(req: Request) {
  const uid = getUserId(req);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json();
  const { title, date } = body || {};
  if (!title || typeof title !== 'string') {
    return new NextResponse('Title is required', { status: 400 });
  }
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return new NextResponse('A valid date is required', { status: 400 });
  }

  const prisma = getPrisma();
  if (prisma) {
    const row = await prisma.lodgeWork.create({
      data: {
        userId: uid,
        title: title.trim(),
        date: parsedDate,
        lodgeName: stringOrNull(body.lodgeName),
        lodgeNumber: stringOrNull(body.lodgeNumber),
        notes: stringOrNull(body.notes),
        createdBy: stringOrNull(body.createdBy),
        grandLodgeVisit: Boolean(body.grandLodgeVisit),
        emergencyMeeting: Boolean(body.emergencyMeeting),
      },
    });
    return NextResponse.json(serialize(row), { status: 201 });
  }

  // fallback
  const created = memStore.create({
    title: title.trim(),
    date: parsedDate.toISOString(),
    lodgeName: stringOrNull(body.lodgeName) ?? undefined,
    lodgeNumber: stringOrNull(body.lodgeNumber) ?? undefined,
    notes: stringOrNull(body.notes) ?? undefined,
    createdBy: stringOrNull(body.createdBy) ?? undefined,
  });
  return NextResponse.json(created, { status: 201 });
}
