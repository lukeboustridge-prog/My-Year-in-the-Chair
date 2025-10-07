import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { parseVisitDate, visitSchema } from "../route";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const existing = await db.visit.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== uid) {
    return new NextResponse("Not found", { status: 404 });
  }
  const body = await req.json();
  const parsed = visitSchema.partial().safeParse(body);
  if (!parsed.success) {
    return new NextResponse("Invalid input", { status: 400 });
  }
  const data = parsed.data;
  const updated = await db.visit.update({
    where: { id: params.id },
    data: {
      date: data.date ? parseVisitDate(data.date) : existing.date,
      lodgeName: data.lodgeName ?? existing.lodgeName,
      lodgeNumber: data.lodgeNumber ?? existing.lodgeNumber,
      region: data.region ?? existing.region,
      workOfEvening: data.workOfEvening ?? existing.workOfEvening,
      candidateName: data.candidateName ?? existing.candidateName,
      grandLodgeVisit: data.grandLodgeVisit ?? existing.grandLodgeVisit,
      comments: data.comments ?? existing.comments,
      notes: data.notes ?? existing.notes,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const existing = await db.visit.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== uid) {
    return new NextResponse("Not found", { status: 404 });
  }
  await db.visit.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
