import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageEventVisibility } from "@/lib/permissions";

const updateSchema = z.object({
  displayOnEventsPage: z.boolean().optional(),
});

type RouteContext = {
  params: { id: string };
};

export async function PATCH(req: Request, { params }: RouteContext) {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const lodgeWorkId = params?.id;
  if (!lodgeWorkId) return new NextResponse("Not found", { status: 404 });

  let parsedBody: z.infer<typeof updateSchema>;
  try {
    const json = await req.json();
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) return new NextResponse("Invalid input", { status: 400 });
    parsedBody = parsed.data;
  } catch {
    return new NextResponse("Invalid input", { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const canManage = canManageEventVisibility(user.role);

  if (parsedBody.displayOnEventsPage !== undefined && !canManage) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    await db.lodgeWork.update({
      where: { id: lodgeWorkId, userId },
      data: {
        ...(parsedBody.displayOnEventsPage !== undefined
          ? { displayOnEventsPage: parsedBody.displayOnEventsPage }
          : {}),
      },
    });
  } catch (error) {
    console.error("WORKINGS_PATCH", error);
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
