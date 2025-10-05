import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";

const visitSchema = z.object({
  date: z.string(), // ISO date (no time needed)
  lodgeName: z.string().min(1),
  lodgeNumber: z.string().min(1),
  region: z.string().optional(),
  workOfEvening: z.enum(["INITIATION","PASSING","RAISING","INSTALLATION","PRESENTATION","LECTURE","OTHER"]),
  candidateName: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const visits = await db.visit.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(visits);
}

export async function POST(req: Request) {
  try {
    const userId = getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const parsed = visitSchema.safeParse(body);
    if (!parsed.success) return new NextResponse("Invalid input", { status: 400 });

    const v = parsed.data;
    const visit = await db.visit.create({
      data: {
        userId,
        date: new Date(v.date),
        lodgeName: v.lodgeName,
        lodgeNumber: v.lodgeNumber,
        region: v.region ?? null,
        workOfEvening: v.workOfEvening,
        candidateName: v.candidateName ?? null,
        location: v.location ?? null,
        notes: v.notes ?? null,
      },
    });

    // Simple points: +1 per visit (tweak later)
    await db.user.update({ where: { id: userId }, data: { points: { increment: 1 } } });

    return NextResponse.json(visit, { status: 201 });
  } catch (e) {
    console.error("VISITS_POST", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
