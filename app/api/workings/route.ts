import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";

const WORK_TYPES = [
  "INITIATION",
  "PASSING",
  "RAISING",
  "INSTALLATION",
  "PRESENTATION",
  "LECTURE",
  "OTHER",
] as const;

const schema = z.object({
  meetingDate: z.string().optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(3000).optional(),
  work: z.enum(WORK_TYPES),
  candidateName: z.string().optional(),
  lecture: z.string().optional(),
  tracingBoard1: z.boolean().optional(),
  tracingBoard2: z.boolean().optional(),
  tracingBoard3: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const items = await db.lodgeWork.findMany({
    where: { userId },
    orderBy: [
      { meetingDate: "asc" },
      { year: "asc" },
      { month: "asc" },
    ],
  });
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
    const meetingDate = d.meetingDate ? new Date(d.meetingDate) : undefined;
    if (meetingDate && isNaN(meetingDate.getTime())) {
      return new NextResponse("Invalid meeting date", { status: 400 });
    }
    const month = meetingDate ? meetingDate.getMonth() + 1 : d.month;
    const year = meetingDate ? meetingDate.getFullYear() : d.year;
    if (!month || !year) {
      return new NextResponse("Month and year are required", { status: 400 });
    }
    const item = await db.lodgeWork.create({
      data: {
        userId,
        meetingDate: meetingDate ?? null,
        month,
        year,
        work: d.work,
        candidateName: d.candidateName ?? null,
        lecture: d.lecture ?? null,
        tracingBoard1: d.tracingBoard1 ?? false,
        tracingBoard2: d.tracingBoard2 ?? false,
        tracingBoard3: d.tracingBoard3 ?? false,
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("WORKINGS_POST", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
