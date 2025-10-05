import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";

const schema = z.object({
  date: z.string(),
  work: z.enum(["INITIATION","PASSING","RAISING","INSTALLATION","PRESENTATION","LECTURE","OTHER"]),
  candidateName: z.string().optional(),
  comments: z.string().optional(),
});

export async function GET() {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const rows = await db.myWork.findMany({ where: { userId }, orderBy: { date: "desc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return new NextResponse("Invalid input", { status: 400 });
    const d = parsed.data;
    const row = await db.myWork.create({
      data: {
        userId,
        date: new Date(d.date),
        work: d.work,
        candidateName: d.candidateName ?? null,
        comments: d.comments ?? null,
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("MYWORK_POST", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
