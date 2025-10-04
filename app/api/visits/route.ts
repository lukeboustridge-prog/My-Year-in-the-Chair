import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const visits = await db.visit.findMany({ orderBy: { date: "desc" } });
  return Response.json(visits);
}

export async function POST(req: Request) {
  const session = getSession();
  const body = await req.json();
  let userId = session?.userId;
  if (!userId) {
    const firstUser = await db.user.findFirst();
    if (!firstUser) return new Response("No user to attach visit", { status: 400 });
    userId = firstUser.id;
  }
  const visit = await db.visit.create({
    data: {
      userId,
      date: new Date(body.date),
      lodgeName: body.lodgeName,
      lodgeNumber: body.lodgeNumber,
      location: body.location ?? null,
      notes: body.notes ?? null
    }
  });
  await db.user.update({ where: { id: userId }, data: { points: { increment: 5 } } });
  return Response.json(visit);
}
