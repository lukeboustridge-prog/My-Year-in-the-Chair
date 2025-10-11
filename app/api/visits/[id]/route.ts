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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();

  const viewer = await db.user.findUnique({ where: { id: uid }, select: { rank: true } });
  const isMaster = isWorshipfulMaster(viewer?.rank);

  const data: Record<string, unknown> = {
    date: new Date(body.date),
    lodgeName: body.lodgeName ?? null,
    lodgeNumber: body.lodgeNumber ?? null,
    regionName:
      body.regionName === undefined
        ? undefined
        : typeof body.regionName === "string"
        ? body.regionName.trim() || null
        : null,
    workOfEvening: body.workOfEvening ?? null,
    candidateName: body.candidateName ?? null,
    comments: body.comments ?? body.notes ?? null,
    notes: body.notes ?? null,
    isGrandLodgeVisit:
      typeof body.isGrandLodgeVisit === "boolean" ? body.isGrandLodgeVisit : undefined,
    hasTracingBoards:
      typeof body.hasTracingBoards === "boolean" ? body.hasTracingBoards : undefined,
    grandMasterInAttendance:
      typeof body.grandMasterInAttendance === "boolean"
        ? body.grandMasterInAttendance
        : undefined,
  };

  if (isMaster && body.accompanyingBrethrenCount !== undefined) {
    data.accompanyingBrethrenCount = sanitiseAccompanyingCount(body.accompanyingBrethrenCount);
  }

  await db.visit.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  await db.visit.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
