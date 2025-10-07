import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const rows = await db.visit.findMany({ where: { userId: uid }, orderBy: { date: "desc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  const created = await db.visit.create({
    data: {
      userId: uid,
      date: new Date(body.date),
      lodgeName: body.lodgeName || null,
      lodgeNumber: body.lodgeNumber || null,
      region: body.region || null,
      workOfEvening: body.workOfEvening || "OTHER",
      candidateName: body.candidateName || null,
      comments: body.comments || null,
      grandLodgeVisit: Boolean(body.grandLodgeVisit),
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PUT(req: Request) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  if (!body.id) return new NextResponse("Missing id", { status: 400 });

  const existing = await db.visit.findUnique({ where: { id: body.id } });
  if (!existing || existing.userId !== uid) return new NextResponse("Not found", { status: 404 });

  const updated = await db.visit.update({
    where: { id: body.id },
    data: {
      date: body.date ? new Date(body.date) : existing.date,
      lodgeName: body.lodgeName ?? existing.lodgeName,
      lodgeNumber: body.lodgeNumber ?? existing.lodgeNumber,
      region: body.region ?? existing.region,
      workOfEvening: body.workOfEvening ?? existing.workOfEvening,
      candidateName: body.candidateName ?? existing.candidateName,
      comments: body.comments ?? existing.comments,
      grandLodgeVisit: typeof body.grandLodgeVisit === "boolean"
        ? body.grandLodgeVisit
        : existing.grandLodgeVisit,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  if (!body.id) return new NextResponse("Missing id", { status: 400 });

  const existing = await db.visit.findUnique({ where: { id: body.id } });
  if (!existing || existing.userId !== uid) return new NextResponse("Not found", { status: 404 });

  await db.visit.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
