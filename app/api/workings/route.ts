import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { lodgeWorkSchema, parseMeetingDate } from "./shared";

export async function GET(req: Request) {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit")) || undefined;

  const items = await db.lodgeWork.findMany({
    where: { userId },
    orderBy: [
      { meetingDate: "desc" },
      { year: "desc" },
      { month: "desc" },
      { createdAt: "desc" },
    ],
    ...(limit ? { take: limit } : {}),
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const parsed = lodgeWorkSchema.safeParse(body);
    if (!parsed.success) {
      return new NextResponse("Invalid input", { status: 400 });
    }

    const data = parsed.data;
    let meetingDate: Date | undefined;
    try {
      meetingDate = data.meetingDate
        ? parseMeetingDate(data.meetingDate)
        : undefined;
    } catch {
      return new NextResponse("Invalid meeting date", { status: 400 });
    }

    const month = meetingDate ? meetingDate.getMonth() + 1 : data.month;
    const year = meetingDate ? meetingDate.getFullYear() : data.year;

    if (!month || !year) {
      return new NextResponse("Month and year are required", { status: 400 });
    }

    const item = await db.lodgeWork.create({
      data: {
        userId,
        meetingDate: meetingDate ?? null,
        month,
        year,
        work: data.work,
        candidateName: data.candidateName ?? null,
        lecture: data.lecture ?? null,
        tracingBoard1: data.tracingBoard1 ?? false,
        tracingBoard2: data.tracingBoard2 ?? false,
        tracingBoard3: data.tracingBoard3 ?? false,
        notes: data.notes ?? null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("WORKINGS_POST", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
