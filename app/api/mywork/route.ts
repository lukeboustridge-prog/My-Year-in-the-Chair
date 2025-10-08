import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const rows = await db.myWork.findMany({ where: { userId: uid }, orderBy: { date: "desc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  const created = await db.myWork.create({
    data: {
      userId: uid,
      date: new Date(body.date),
      work: body.work || "OTHER",
      candidateName: body.candidateName || null,
      comments: body.comments || null,
      isGrandLodgeVisit: Boolean(body.isGrandLodgeVisit),
      isEmergencyMeeting: Boolean(body.isEmergencyMeeting),
      hasFirstTracingBoard: Boolean(body.hasFirstTracingBoard),
      hasSecondTracingBoard: Boolean(body.hasSecondTracingBoard),
      hasThirdTracingBoard: Boolean(body.hasThirdTracingBoard),
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PUT(req: Request) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  if (!body.id) return new NextResponse("Missing id", { status: 400 });

  const existing = await db.myWork.findUnique({ where: { id: body.id } });
  if (!existing || existing.userId !== uid) return new NextResponse("Not found", { status: 404 });

  const updated = await db.myWork.update({
    where: { id: body.id },
    data: {
      date: body.date ? new Date(body.date) : existing.date,
      work: body.work ?? existing.work,
      candidateName: body.candidateName ?? existing.candidateName,
      comments: body.comments ?? existing.comments,
      isGrandLodgeVisit:
        typeof body.isGrandLodgeVisit === "boolean"
          ? body.isGrandLodgeVisit
          : existing.isGrandLodgeVisit,
      isEmergencyMeeting:
        typeof body.isEmergencyMeeting === "boolean"
          ? body.isEmergencyMeeting
          : existing.isEmergencyMeeting,
      hasFirstTracingBoard:
        typeof body.hasFirstTracingBoard === "boolean"
          ? body.hasFirstTracingBoard
          : existing.hasFirstTracingBoard,
      hasSecondTracingBoard:
        typeof body.hasSecondTracingBoard === "boolean"
          ? body.hasSecondTracingBoard
          : existing.hasSecondTracingBoard,
      hasThirdTracingBoard:
        typeof body.hasThirdTracingBoard === "boolean"
          ? body.hasThirdTracingBoard
          : existing.hasThirdTracingBoard,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  if (!body.id) return new NextResponse("Missing id", { status: 400 });

  const existing = await db.myWork.findUnique({ where: { id: body.id } });
  if (!existing || existing.userId !== uid) return new NextResponse("Not found", { status: 404 });

  await db.myWork.delete({ where: { id: body.id } });
  return NextResponse.json({ ok: true });
}
