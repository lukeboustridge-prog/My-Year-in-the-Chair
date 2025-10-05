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
    prefix: u.prefix,
    postNominals: u.postNominals,
    lodgeName: u.lodgeName,
    lodgeNumber: u.lodgeNumber,
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
      rank: body.rank ?? null,
      isPastGrand: Boolean(body.isPastGrand),
      prefix: body.prefix ?? null,
      postNominals: Array.isArray(body.postNominals) ? body.postNominals : [],
      lodgeName: body.lodgeName ?? null,
      lodgeNumber: body.lodgeNumber ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
