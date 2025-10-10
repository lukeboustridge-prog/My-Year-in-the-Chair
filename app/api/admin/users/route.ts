import { NextResponse } from "next/server";

import { getCurrentAdmin, getCurrentUser } from "@/lib/currentUser";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Forbidden", { status: 403 });
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isApproved: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
  );
}
