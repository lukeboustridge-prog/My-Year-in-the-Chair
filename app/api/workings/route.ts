// app/api/workings/route.ts
import { NextResponse } from 'next/server';
import { getPrisma, memStore } from '@/lib/db';
import { getUserId } from '@/lib/auth';

type WorkType =
  | 'INITIATION'
  | 'PASSING'
  | 'RAISING'
  | 'INSTALLATION'
  | 'PRESENTATION'
  | 'LECTURE'
  | 'OTHER';

const WORK_LABEL_BY_ENUM: Record<WorkType, string> = {
  INITIATION: 'Initiation',
  PASSING: 'Passing',
  RAISING: 'Raising',
  INSTALLATION: 'Installation',
  PRESENTATION: 'Presentation',
  LECTURE: 'Lecture',
  OTHER: 'Other',
};

function labelToEnum(label?: string | null): WorkType {
  if (!label) return 'OTHER';
  const normalised = label.trim().toLowerCase();
  switch (normalised) {
    case 'initiation':
    case 'ea':
      return 'INITIATION';
    case 'passing':
    case 'fc':
      return 'PASSING';
    case 'raising':
    case 'mm':
      return 'RAISING';
    case 'installation':
      return 'INSTALLATION';
    case 'presentation':
      return 'PRESENTATION';
    case 'lecture':
      return 'LECTURE';
    default:
      return 'OTHER';
  }
}

function parseIncomingWork(body: any): { work: WorkType; candidateName: string | null } {
  const fromBody = typeof body?.work === 'string' ? (body.work as string) : undefined;
  if (fromBody) {
    return { work: labelToEnum(fromBody.replace(/_/g, ' ')), candidateName: body?.candidateName ?? null };
  }

  const title: string = typeof body?.title === 'string' ? body.title : '';
  const [maybeWork, maybeCandidate] = title.split('–').map(part => part.trim());
  const work = labelToEnum(maybeWork);
  const candidateName = body?.candidateName ?? (maybeCandidate ? maybeCandidate : null);
  return { work, candidateName };
}

function toLegacyShape(row: any) {
  const workEnum: WorkType = row?.work ?? 'OTHER';
  const label = WORK_LABEL_BY_ENUM[workEnum] ?? WORK_LABEL_BY_ENUM.OTHER;
  const candidateName = row?.candidateName ?? row?.candidate ?? null;
  const derivedTitle = candidateName ? `${label} – ${candidateName}` : label;
  const title = row?.title ?? derivedTitle;
  const dateValue = row?.date instanceof Date ? row.date.toISOString() : row?.date ?? null;
  const createdAt = row?.createdAt instanceof Date ? row.createdAt.toISOString() : row?.createdAt ?? null;
  const updatedAt = row?.updatedAt instanceof Date ? row.updatedAt.toISOString() : row?.updatedAt ?? createdAt;

  return {
    id: row?.id,
    title,
    date: dateValue,
    lodgeName: row?.lodgeName ?? null,
    lodgeNumber: row?.lodgeNumber ?? null,
    notes: row?.notes ?? row?.comments ?? null,
    createdBy: row?.createdBy ?? row?.userId ?? null,
    createdAt,
    updatedAt,
  };
}

export async function GET() {
  const prisma = getPrisma() as any;
  if (prisma) {
    const userId = getUserId();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });
    const rows = await prisma.myWork.findMany({ where: { userId }, orderBy: { date: 'desc' } });
    return NextResponse.json(rows.map(toLegacyShape));
  }
  // fallback
  return NextResponse.json(memStore.list().map(toLegacyShape));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, date, lodgeName, lodgeNumber, notes, createdBy } = body || {};
  if (!title || !date) {
    return new NextResponse('Title and date are required', { status: 400 });
  }

  const prisma = getPrisma() as any;
  if (prisma) {
    const userId = getUserId();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });
    const { work, candidateName } = parseIncomingWork(body);
    const row = await prisma.myWork.create({
      data: {
        userId,
        date: new Date(date),
        work,
        candidateName,
        comments: notes ?? null,
      },
    });
    return NextResponse.json(toLegacyShape(row), { status: 201 });
  }

  // fallback
  const created = memStore.create({ title, date, lodgeName, lodgeNumber, notes, createdBy });
  return NextResponse.json(toLegacyShape(created), { status: 201 });
}
