import type { User } from "@prisma/client";

import { getUserId } from "./auth";
import { db } from "./db";

export type CurrentUser = Pick<User, "id" | "email" | "role" | "isApproved" | "name">;

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const uid = getUserId();
  if (!uid) return null;

  const user = await db.user.findUnique({
    where: { id: uid },
    select: {
      id: true,
      email: true,
      role: true,
      isApproved: true,
      name: true,
    },
  });

  return user ?? null;
}

export async function getCurrentAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return null;
  }
  return user;
}
