import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { deriveEventLabel, deriveWork, parseDate, serializeVisit, stringOrNull } from "../helpers";

function prismaOr500() {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database client not available");
  return prisma;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const uid = getUserId(req);
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });

  const prisma = prismaOr500();
  const body = await req.json();

  const existing = await prisma.visit.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== uid) return new NextResponse("Not found", { status: 404 });

  const updates: any = {};
  if (body.date || body.dateISO) {
    const parsed = parseDate(body.date ?? body.dateISO);
    if (!parsed) return new NextResponse("Invalid date", { status: 400 });
    updates.date = parsed;
  }
  if ("lodgeName" in body) updates.lodgeName = stringOrNull(body.lodgeName);
  if ("lodgeNumber" in body) updates.lodgeNumber = stringOrNull(body.lodgeNumber);
  if ("region" in body) updates.region = stringOrNull(body.region);
  if ("location" in body) updates.location = stringOrNull(body.location);
  if ("candidateName" in body) updates.candidateName = stringOrNull(body.candidateName);
  if ("comments" in body || "notes" in body) {
    const comments = stringOrNull(body.comments ?? body.notes);
    updates.comments = comments;
    if ("notes" in body) updates.notes = stringOrNull(body.notes);
  }
  if ("grandLodgeVisit" in body) updates.grandLodgeVisit = Boolean(body.grandLodgeVisit);

  if ("workOfEvening" in body || "eventType" in body || "work" in body) {
    const work = deriveWork({ ...body, workOfEvening: body?.workOfEvening ?? body?.work }, existing.workOfEvening);
    updates.workOfEvening = work;
    updates.eventType = deriveEventLabel(body, work);
  } else if ("eventType" in body) {
    updates.eventType = deriveEventLabel(body, existing.workOfEvening);
  }

  const updated = await prisma.visit.update({ where: { id: params.id }, data: updates });
  return NextResponse.json(serializeVisit(updated));
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const uid = getUserId(req);
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });

  const prisma = prismaOr500();
  const existing = await prisma.visit.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== uid) return new NextResponse("Not found", { status: 404 });

  await prisma.visit.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
