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
  const { name, prefix, postNominals, lodgeName, lodgeNumber, region, termStart, termEnd } = body;

  await db.user.update({
    where: { id: uid },
    data: {
      name: name ?? null,
      prefix: prefix ?? null,
      postNominals: Array.isArray(postNominals) ? postNominals : [],
      lodgeName: lodgeName ?? null,
      lodgeNumber: lodgeNumber ?? null,
      region: region ?? null,
      termStart: termStart ? new Date(termStart) : null,
      termEnd: termEnd ? new Date(termEnd) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
