// app/api/workings/route.ts
import { NextResponse } from 'next/server';
import { getPrisma, memStore } from '@/lib/db';

export async function GET() {
  const prisma = getPrisma();
  if (prisma) {
    const rows = await prisma.lodgeWork.findMany();
    // Sort safely in JS by whichever timestamp exists (date -> createdAt -> updatedAt)
    const sorted = [...rows].sort((a: any, b: any) => {
      const bKey = (b?.date ?? b?.createdAt ?? b?.updatedAt ?? '').toString();
      const aKey = (a?.date ?? a?.createdAt ?? a?.updatedAt ?? '').toString();
      return bKey.localeCompare(aKey);
    });
    return NextResponse.json(sorted);
  }
  // fallback
  return NextResponse.json(memStore.list());
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, date, lodgeName, lodgeNumber, notes, createdBy } = body || {};
  if (!title || !date) {
    return new NextResponse('Title and date are required', { status: 400 });
  }

  const prisma = getPrisma();
  if (prisma) {
    const row = await prisma.lodgeWork.create({
      data: {
        title,
        date: new Date(date),
        lodgeName: lodgeName || null,
        lodgeNumber: lodgeNumber || null,
        notes: notes || null,
        createdBy: createdBy || null,
      },
    });
    return NextResponse.json(row, { status: 201 });
  }

  // fallback
  const created = memStore.create({ title, date, lodgeName, lodgeNumber, notes, createdBy });
  return NextResponse.json(created, { status: 201 });
}
