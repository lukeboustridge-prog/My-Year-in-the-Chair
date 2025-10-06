// app/api/workings/[id]/route.ts
import { NextResponse } from 'next/server';
import { getPrisma, memStore } from '@/lib/db';
import { getUserId } from '@/lib/auth';

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = params;
  if (!id) return new NextResponse('Missing id', { status: 400 });

  const prismaAny = getPrisma() as any;
  if (prismaAny) {
    const userId = getUserId(_req);
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });
    try {
      const existing = await prismaAny.myWork.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return new NextResponse('Not found', { status: 404 });
      }
      await prismaAny.myWork.delete({ where: { id } });
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      console.error('delete_working_error', err);
      return new NextResponse('Not found', { status: 404 });
    }
  }

  // fallback
  const ok = memStore.delete(id);
  if (!ok) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(null, { status: 204 });
}
