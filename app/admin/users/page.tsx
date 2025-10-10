export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { getCurrentApprover, getCurrentUser } from "@/lib/currentUser";
import { db } from "@/lib/db";

import UserManagement from "./UserManagement";

export default async function AdminUsersPage() {
  const approver = await getCurrentApprover();
  if (!approver) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/login?redirect=${encodeURIComponent("/admin/users")}`);
    }
    redirect("/");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">User administration</h1>
        <p className="subtle">
          Review new registrations and control who can access shared features such as the leaderboard.
        </p>
      </div>
      <UserManagement
        viewerRole={approver.role}
        viewerRegion={approver.region ?? null}
        initialUsers={users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
