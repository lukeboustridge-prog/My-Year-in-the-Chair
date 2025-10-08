import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";

const schema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(3000),
  work: z.enum(["INITIATION","PASSING","RAISING","INSTALLATION","PRESENTATION","LECTURE","OTHER"]),
  candidateName: z.string().optional(),
  notes: z.string().optional(),
  isGrandLodgeVisit: z.boolean().optional(),
  isEmergencyMeeting: z.boolean().optional(),
  hasFirstTracingBoard: z.boolean().optional(),
  hasSecondTracingBoard: z.boolean().optional(),
  hasThirdTracingBoard: z.boolean().optional(),
  hasTracingBoards: z.boolean().optional(),
});

export async function GET() {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const items = await db.lodgeWork.findMany({ where: { userId }, orderBy: [{ year: "asc" }, { month: "asc" }] });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return new NextResponse("Invalid input", { status: 400 });
    const d = parsed.data;
    const item = await db.lodgeWork.create({
      data: {
        userId,
        month: d.month,
        year: d.year,
        work: d.work,
        candidateName: d.candidateName ?? null,
        notes: d.notes ?? null,
        isGrandLodgeVisit: Boolean(d.isGrandLodgeVisit),
        isEmergencyMeeting: Boolean(d.isEmergencyMeeting),
        hasFirstTracingBoard: Boolean(d.hasFirstTracingBoard),
        hasSecondTracingBoard: Boolean(d.hasSecondTracingBoard),
        hasThirdTracingBoard: Boolean(d.hasThirdTracingBoard),
        hasTracingBoards:
          typeof d.hasTracingBoards === "boolean"
            ? d.hasTracingBoards
            : Boolean(d.hasFirstTracingBoard || d.hasSecondTracingBoard || d.hasThirdTracingBoard),
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("WORKINGS_POST", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
