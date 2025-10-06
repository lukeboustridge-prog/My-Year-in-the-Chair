import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { lodgeName, lodgeNo, workingType, date, notes } = await req.json();
    if (!lodgeName || !lodgeNo || !workingType || !date) {
      return NextResponse.json({ error: 'lodgeName, lodgeNo, workingType and date are required' }, { status: 400 });
    }
    const created = await prisma.working.create({
      data: { lodgeName, lodgeNo, workingType, date: new Date(date), notes }
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Create failed' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.working.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Delete failed' }, { status: 400 });
  }
}
