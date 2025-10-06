// app/api/workings/[id]/route.ts
import { NextResponse } from 'next/server';
import { getPrisma, memStore } from '@/lib/db';
import { getUserId } from '@/lib/auth';

type Params = { params: { id: string } };

export async function DELETE(req: Request, { params }: Params) {
  const { id } = params;
  if (!id) return new NextResponse('Missing id', { status: 400 });

  const uid = getUserId(req);
  if (!uid) return new NextResponse('Unauthorized', { status: 401 });

  const prisma = getPrisma();
  if (prisma) {
    const existing = await prisma.lodgeWork.findUnique({ where: { id } });
    if (!existing || existing.userId !== uid) {
      return new NextResponse('Not found', { status: 404 });
    }
    await prisma.lodgeWork.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  }

  // fallback
  const ok = memStore.delete(id);
  if (!ok) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(null, { status: 204 });
}
