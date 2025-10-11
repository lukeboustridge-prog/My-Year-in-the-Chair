import { NextResponse } from "next/server";

import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = {
  params: { id: string };
};

function getEventDate(year: number, month: number): Date {
  const safeMonth = Math.min(Math.max(month, 1), 12) - 1;
  return new Date(Date.UTC(year, safeMonth, 1));
}

export async function POST(_req: Request, { params }: RouteContext) {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const lodgeWorkId = params?.id;
  if (!lodgeWorkId) return new NextResponse("Not found", { status: 404 });

  const lodgeWork = await db.lodgeWork.findUnique({
    where: { id: lodgeWorkId },
    include: {
      user: {
        select: {
          id: true,
          lodgeName: true,
          lodgeNumber: true,
          region: true,
        },
      },
    },
  });

  if (!lodgeWork || !lodgeWork.displayOnEventsPage) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (lodgeWork.userId === userId) {
    return new NextResponse("Hosts cannot RSVP to their own working", { status: 400 });
  }

  const eventDate = getEventDate(lodgeWork.year, lodgeWork.month);

  try {
    await db.$transaction(async (tx) => {
      const visit = await tx.visit.create({
        data: {
          userId,
          date: eventDate,
          lodgeName: lodgeWork.user.lodgeName ?? null,
          lodgeNumber: lodgeWork.user.lodgeNumber ?? null,
          regionName: lodgeWork.user.region ?? null,
          workOfEvening: lodgeWork.work,
          candidateName: lodgeWork.candidateName ?? null,
          isGrandLodgeVisit: lodgeWork.isGrandLodgeVisit,
          hasTracingBoards:
            lodgeWork.hasTracingBoards ||
            lodgeWork.hasFirstTracingBoard ||
            lodgeWork.hasSecondTracingBoard ||
            lodgeWork.hasThirdTracingBoard,
          notes: lodgeWork.notes ?? null,
        },
      });

      await tx.lodgeWorkRsvp.create({
        data: {
          lodgeWorkId,
          userId,
          visitId: visit.id,
        },
      });
    });
  } catch (error: any) {
    console.error("WORKINGS_RSVP", error);
    if (error?.code === "P2002") {
      return new NextResponse("Already RSVPed", { status: 409 });
    }
    return new NextResponse("Server error", { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
