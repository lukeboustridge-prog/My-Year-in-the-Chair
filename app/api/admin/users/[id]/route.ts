import { NextResponse } from "next/server";

import { getCurrentApprover, getCurrentUser } from "@/lib/currentUser";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const approver = await getCurrentApprover();
  if (!approver) {
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
  if (!body || typeof body !== "object") {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const target = await db.user.findUnique({
    where: { id },
    select: {
      region: true,
      role: true,
    },
  });

  if (!target) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (approver.role === "DISTRICT") {
    if (!approver.region) {
      return new NextResponse("Region not configured", { status: 400 });
    }
    if (target.region !== approver.region) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    if (target.role === "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    if (target.role && target.role !== "USER" && id !== approver.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const data: { isApproved?: boolean; role?: string } = {};

  if (Object.prototype.hasOwnProperty.call(body, "isApproved")) {
    if (typeof body.isApproved !== "boolean") {
      return new NextResponse("Invalid approval flag", { status: 400 });
    }
    data.isApproved = body.isApproved;
  }

  if (Object.prototype.hasOwnProperty.call(body, "role")) {
    if (approver.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    if (typeof body.role !== "string") {
      return new NextResponse("Invalid role", { status: 400 });
    }
    const allowedRoles = ["USER", "ADMIN", "DISTRICT"];
    if (!allowedRoles.includes(body.role)) {
      return new NextResponse("Invalid role", { status: 400 });
    }
    data.role = body.role;
  }

  if (!("isApproved" in data) && !("role" in data)) {
    return new NextResponse("No changes supplied", { status: 400 });
  }

  const updated = await db.user
    .update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
        createdAt: true,
        region: true,
      },
    })
    .catch(() => null);

  if (!updated) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
  });
}
