import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().max(100).optional(),
  lodgeName: z.string().max(200).optional(),
  lodgeNumber: z.string().max(50).optional(),
  region: z.string().max(100).optional(),
  termStart: z.string().optional(), // ISO yyyy-mm-dd
  termEnd: z.string().optional(),
});

export async function GET() {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const u = await db.user.findUnique({ where: { id: userId } });
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json({
    email: u.email,
    name: u.name,
    lodgeName: u.lodgeName,
    lodgeNumber: u.lodgeNumber,
    region: u.region,
    termStart: u.termStart?.toISOString() ?? null,
    termEnd: u.termEnd?.toISOString() ?? null,
  });
}

export async function PUT(req: Request) {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return new NextResponse("Invalid input", { status: 400 });
    const d = parsed.data;

    const termStart = d.termStart ? new Date(d.termStart) : null;
    const termEnd = d.termEnd ? new Date(d.termEnd) : null;

    await db.user.update({
      where: { id: userId },
      data: {
        name: d.name ?? null,
        lodgeName: d.lodgeName ?? null,
        lodgeNumber: d.lodgeNumber ?? null,
        region: d.region ?? null,
        termStart,
        termEnd,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PROFILE_PUT", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
