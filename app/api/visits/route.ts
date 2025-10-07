import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

export const WORK_TYPES = [
  "INITIATION",
  "PASSING",
  "RAISING",
  "INSTALLATION",
  "PRESENTATION",
  "LECTURE",
  "OTHER",
] as const;

export const visitSchema = z.object({
  date: z.string().min(1),
  lodgeName: z.string().optional(),
  lodgeNumber: z.string().optional(),
  region: z.string().optional(),
  workOfEvening: z.enum(WORK_TYPES).optional(),
  candidateName: z.string().optional(),
  grandLodgeVisit: z.boolean().optional(),
  comments: z.string().optional(),
  notes: z.string().optional(),
});

export function parseVisitDate(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date;
}

export async function GET() {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const rows = await db.visit.findMany({
    where: { userId: uid },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const body = await req.json();
    const parsed = visitSchema.safeParse(body);
    if (!parsed.success) {
      return new NextResponse("Invalid input", { status: 400 });
    }
    const data = parsed.data;
    const created = await db.visit.create({
      data: {
        userId: uid,
        date: parseVisitDate(data.date),
        lodgeName: data.lodgeName ?? null,
        lodgeNumber: data.lodgeNumber ?? null,
        region: data.region ?? null,
        workOfEvening: data.workOfEvening ?? "OTHER",
        candidateName: data.candidateName ?? null,
        grandLodgeVisit: data.grandLodgeVisit ?? false,
        comments: data.comments ?? null,
        notes: data.notes ?? null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("VISITS_POST", error);
    return new NextResponse("Server error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();
  if (!body.id) return new NextResponse("Missing id", { status: 400 });

  const existing = await db.visit.findUnique({ where: { id: body.id } });
  if (!existing || existing.userId !== uid) return new NextResponse("Not found", { status: 404 });

  const parsed = visitSchema.partial().safeParse(body);
  if (!parsed.success) {
    return new NextResponse("Invalid input", { status: 400 });
  }
  const data = parsed.data;
  const updated = await db.visit.update({
    where: { id: body.id },
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
