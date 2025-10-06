import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lodgeName, lodgeNo, date, notes } = body ?? {};
    if (!lodgeName || !lodgeNo || !date) {
      return NextResponse.json({ error: 'lodgeName, lodgeNo and date are required' }, { status: 400 });
    }
    const created = await prisma.visit.create({
      data: { lodgeName, lodgeNo, date: new Date(date), notes },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Create failed' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.visit.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Delete failed' }, { status: 400 });
  }
}
