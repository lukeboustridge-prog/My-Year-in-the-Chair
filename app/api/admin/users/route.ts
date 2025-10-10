import { NextResponse } from "next/server";

import { getCurrentApprover, getCurrentUser } from "@/lib/currentUser";
import { db } from "@/lib/db";

export async function GET() {
  const approver = await getCurrentApprover();
  if (!approver) {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Forbidden", { status: 403 });
  }

  const where =
    approver.role === "ADMIN"
      ? undefined
      : approver.region
      ? { region: approver.region }
      : { id: approver.id };

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isApproved: true,
      createdAt: true,
      region: true,
    },
  });

  return NextResponse.json(
    users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
  );
}
