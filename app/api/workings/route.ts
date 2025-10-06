// app/api/workings/route.ts
import { NextResponse } from 'next/server';
import { getPrisma, memStore } from '@/lib/db';

export async function GET() {
  const prismaAny = getPrisma() as any;
  if (prismaAny) {
    const rows = await prismaAny.lodgeWork.findMany();
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

  const prismaAny = getPrisma() as any;
  if (prismaAny) {
    const data: any = {
      title,
      date: new Date(date),
      lodgeName: lodgeName || null,
      lodgeNumber: lodgeNumber || null,
      notes: notes || null,
      createdBy: createdBy || null,
    };
    const row = await prismaAny.lodgeWork.create({ data });
    return NextResponse.json(row, { status: 201 });
  }

  // fallback
  const created = memStore.create({ title, date, lodgeName, lodgeNumber, notes, createdBy });
  return NextResponse.json(created, { status: 201 });
}
