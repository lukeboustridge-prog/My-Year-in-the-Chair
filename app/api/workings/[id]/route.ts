// app/api/workings/[id]/route.ts
import { NextResponse } from 'next/server';
import { getPrisma, memStore } from '@/lib/db';

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = params;
  if (!id) return new NextResponse('Missing id', { status: 400 });

  const prismaAny = getPrisma() as any;
  if (prismaAny) {
    try {
      await prismaAny.lodgeWork.delete({ where: { id } });
      return new NextResponse(null, { status: 204 });
    } catch {
      return new NextResponse('Not found', { status: 404 });
    }
  }

  // fallback
  const ok = memStore.delete(id);
  if (!ok) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(null, { status: 204 });
}
