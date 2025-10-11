import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const u = await db.user.findUnique({ where: { id: uid } });
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json({
    name: u.name,
    rank: u.rank,
    isPastGrand: u.isPastGrand,
    isSittingMaster: u.isSittingMaster,
    prefix: u.prefix,
    postNominals: u.postNominals,
    lodgeName: u.lodgeName,
    lodgeNumber: u.lodgeNumber,
    region: u.region,
    termStart: u.termStart ? u.termStart.toISOString() : null,
    termEnd: u.termEnd ? u.termEnd.toISOString() : null,
  });
}

export async function PUT(req: Request) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();

  const termStart = typeof body.termStart === "string" && body.termStart
    ? new Date(body.termStart)
    : null;
  const termEnd = typeof body.termEnd === "string" && body.termEnd
    ? new Date(body.termEnd)
    : null;

  await db.user.update({
    where: { id: uid },
    data: {
      name: body.name ?? null,
      rank: body.rank ?? null,
      isPastGrand: Boolean(body.isPastGrand),
      isSittingMaster: Boolean(body.isSittingMaster),
      prefix: body.prefix ?? null,
      postNominals: Array.isArray(body.postNominals) ? body.postNominals : [],
      lodgeName: body.lodgeName ?? null,
      lodgeNumber: body.lodgeNumber ?? null,
      region: body.region ?? null,
      termStart: termStart && !Number.isNaN(termStart.getTime()) ? termStart : null,
      termEnd: termEnd && !Number.isNaN(termEnd.getTime()) ? termEnd : null,
    },
  });

  return NextResponse.json({ ok: true });
}
