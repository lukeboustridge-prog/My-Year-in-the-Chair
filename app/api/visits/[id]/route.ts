import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();

  await db.visit.update({
    where: { id: params.id },
    data: {
      date: new Date(body.date),
      lodgeName: body.lodgeName ?? null,
      lodgeNumber: body.lodgeNumber ?? null,
      workOfEvening: body.workOfEvening ?? null,
      candidateName: body.candidateName ?? null,
      comments: body.comments ?? body.notes ?? null,
      notes: body.notes ?? null,
      isGrandLodgeVisit:
        typeof body.isGrandLodgeVisit === "boolean" ? body.isGrandLodgeVisit : undefined,
      hasTracingBoards:
        typeof body.hasTracingBoards === "boolean" ? body.hasTracingBoards : undefined,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  await db.visit.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
