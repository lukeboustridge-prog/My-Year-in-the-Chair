import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function isWorshipfulMaster(rank: string | null | undefined): boolean {
  if (!rank) return false;
  return rank.trim().toLowerCase() === "worshipful master";
}

function sanitiseAccompanyingCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.max(0, Math.round(parsed));
}

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
  const viewer = await db.user.findUnique({ where: { id: uid }, select: { rank: true } });
  const isMaster = isWorshipfulMaster(viewer?.rank);
  const comments = body.comments ?? body.notes ?? null;
  const regionName =
    typeof body.regionName === "string" ? body.regionName.trim() || null : null;
  const accompanyingBrethrenCount = isMaster
    ? sanitiseAccompanyingCount(body.accompanyingBrethrenCount)
    : 0;
  const created = await db.visit.create({
    data: {
      userId: uid,
      date: new Date(body.date),
      lodgeName: body.lodgeName || null,
      lodgeNumber: body.lodgeNumber || null,
      regionName,
      workOfEvening: body.workOfEvening || "OTHER",
      candidateName: body.candidateName || null,
      comments,
      notes: body.notes ?? null,
      isGrandLodgeVisit: Boolean(body.isGrandLodgeVisit),
      hasTracingBoards: Boolean(body.hasTracingBoards),
      grandMasterInAttendance: Boolean(body.grandMasterInAttendance),
      accompanyingBrethrenCount,
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

  const viewer = await db.user.findUnique({ where: { id: uid }, select: { rank: true } });
  const isMaster = isWorshipfulMaster(viewer?.rank);

  const updateData: Record<string, unknown> = {
    date: body.date ? new Date(body.date) : existing.date,
    lodgeName: body.lodgeName ?? existing.lodgeName,
    lodgeNumber: body.lodgeNumber ?? existing.lodgeNumber,
    regionName:
      body.regionName !== undefined
        ? typeof body.regionName === "string"
          ? body.regionName.trim() || null
          : null
        : existing.regionName,
    workOfEvening: body.workOfEvening ?? existing.workOfEvening,
    candidateName: body.candidateName ?? existing.candidateName,
    comments:
      body.comments !== undefined || body.notes !== undefined
        ? body.comments ?? body.notes ?? null
        : existing.comments,
    notes:
      body.notes !== undefined
        ? body.notes ?? null
        : existing.notes,
    isGrandLodgeVisit:
      typeof body.isGrandLodgeVisit === "boolean"
        ? body.isGrandLodgeVisit
        : existing.isGrandLodgeVisit,
    hasTracingBoards:
      typeof body.hasTracingBoards === "boolean"
        ? body.hasTracingBoards
        : existing.hasTracingBoards,
    grandMasterInAttendance:
      typeof body.grandMasterInAttendance === "boolean"
        ? body.grandMasterInAttendance
        : existing.grandMasterInAttendance,
  };

  if (isMaster && body.accompanyingBrethrenCount !== undefined) {
    updateData.accompanyingBrethrenCount = sanitiseAccompanyingCount(
      body.accompanyingBrethrenCount,
    );
  }

  const updated = await db.visit.update({
    where: { id: body.id },
    data: updateData,
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
