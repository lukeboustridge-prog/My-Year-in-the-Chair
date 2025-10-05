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
    prefix: u.prefix,
    postNominals: u.postNominals,
    grandRank: u.grandRank,
    grandPostNominals: u.grandPostNominals,
    lodgeName: u.lodgeName,
    lodgeNumber: u.lodgeNumber,
    region: u.region,
    termStart: u.termStart?.toISOString() ?? null,
    termEnd: u.termEnd?.toISOString() ?? null,
  });
}

export async function PUT(req: Request) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();

  await db.user.update({
    where: { id: uid },
    data: {
      name: body.name ?? null,
      prefix: body.prefix ?? null,
      postNominals: Array.isArray(body.postNominals) ? body.postNominals : [],
      grandRank: body.grandRank ?? null,
      grandPostNominals: Array.isArray(body.grandPostNominals) ? body.grandPostNominals : [],
      lodgeName: body.lodgeName ?? null,
      lodgeNumber: body.lodgeNumber ?? null,
      region: body.region ?? null,
      termStart: body.termStart ? new Date(body.termStart) : null,
      termEnd: body.termEnd ? new Date(body.termEnd) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
