import { NextResponse } from "next/server";

import { getCurrentAdmin, getCurrentUser } from "@/lib/currentUser";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return new NextResponse("Missing user id", { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const isApproved = body?.isApproved;
  if (typeof isApproved !== "boolean") {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const updated = await db.user.update({
    where: { id },
    data: { isApproved },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isApproved: true,
      createdAt: true,
    },
  }).catch(() => null);

  if (!updated) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
  });
}
