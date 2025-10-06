import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { WorkType } from "@prisma/client";
import { formatWorkTypeLabel, normalizeWorkType, parseDate, stringOrNull } from "../visits/helpers";

function prismaOr500() {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database client not available");
  return prisma;
}

function serialize(row: any) {
  const dateIso = row.date instanceof Date ? row.date.toISOString() : new Date(row.date).toISOString();
  const createdAt = row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt ?? null;
  const updatedAt = row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt ?? null;
  return {
    id: row.id,
    userId: row.userId,
    date: dateIso,
    dateISO: dateIso,
    work: row.work,
    degree: formatWorkTypeLabel(row.work as WorkType),
    candidateName: row.candidateName ?? null,
    lodgeName: row.lodgeName ?? null,
    lodgeNumber: row.lodgeNumber ?? null,
    grandLodgeVisit: Boolean(row.grandLodgeVisit),
    emergencyMeeting: Boolean(row.emergencyMeeting),
    comments: row.comments ?? null,
    notes: row.comments ?? null,
    createdAt,
    updatedAt,
  };
}

function deriveWork(body: any, fallback?: WorkType) {
  return normalizeWorkType(body?.work ?? body?.degree, fallback ?? WorkType.OTHER);
}

export async function GET(req: Request) {
  const uid = getUserId(req);
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });

  const prisma = prismaOr500();
  const rows = await prisma.myWork.findMany({
    where: { userId: uid },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(rows.map(serialize));
}

export async function POST(req: Request) {
  const uid = getUserId(req);
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });

  const prisma = prismaOr500();
  const body = await req.json();

  const date = parseDate(body.date ?? body.dateISO);
  if (!date) return new NextResponse("Invalid or missing date", { status: 400 });

  const work = deriveWork(body);

  const row = await prisma.myWork.create({
    data: {
      userId: uid,
      date,
      work,
      candidateName: stringOrNull(body.candidateName),
      lodgeName: stringOrNull(body.lodgeName),
      lodgeNumber: stringOrNull(body.lodgeNumber),
      grandLodgeVisit: Boolean(body.grandLodgeVisit),
      emergencyMeeting: Boolean(body.emergencyMeeting),
      comments: stringOrNull(body.comments ?? body.notes),
    },
  });

  return NextResponse.json(serialize(row), { status: 201 });
}

export async function PUT(req: Request) {
  const uid = getUserId(req);
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });

  const prisma = prismaOr500();
  const body = await req.json();
  const id = body?.id;
  if (!id || typeof id !== "string") return new NextResponse("Missing id", { status: 400 });

  const existing = await prisma.myWork.findUnique({ where: { id } });
  if (!existing || existing.userId !== uid) return new NextResponse("Not found", { status: 404 });

  const updates: any = {};
  if (body.date || body.dateISO) {
    const parsed = parseDate(body.date ?? body.dateISO);
    if (!parsed) return new NextResponse("Invalid date", { status: 400 });
    updates.date = parsed;
  }
  if ("work" in body || "degree" in body) {
    updates.work = deriveWork(body, existing.work);
  }
  if ("candidateName" in body) updates.candidateName = stringOrNull(body.candidateName);
  if ("lodgeName" in body) updates.lodgeName = stringOrNull(body.lodgeName);
  if ("lodgeNumber" in body) updates.lodgeNumber = stringOrNull(body.lodgeNumber);
  if ("grandLodgeVisit" in body) updates.grandLodgeVisit = Boolean(body.grandLodgeVisit);
  if ("emergencyMeeting" in body) updates.emergencyMeeting = Boolean(body.emergencyMeeting);
  if ("comments" in body || "notes" in body) updates.comments = stringOrNull(body.comments ?? body.notes);

  const updated = await prisma.myWork.update({ where: { id }, data: updates });
  return NextResponse.json(serialize(updated));
}

export async function DELETE(req: Request) {
  const uid = getUserId(req);
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });

  const prisma = prismaOr500();
  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  if (!id || typeof id !== "string") return new NextResponse("Missing id", { status: 400 });

  const existing = await prisma.myWork.findUnique({ where: { id } });
  if (!existing || existing.userId !== uid) return new NextResponse("Not found", { status: 404 });

  await prisma.myWork.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
