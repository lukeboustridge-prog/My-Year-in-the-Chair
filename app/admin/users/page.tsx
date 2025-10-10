export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { getCurrentAdmin, getCurrentUser } from "@/lib/currentUser";
import { db } from "@/lib/db";

import UserManagement from "./UserManagement";

export default async function AdminUsersPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/login?redirect=${encodeURIComponent("/admin/users")}`);
    }
    redirect("/");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">User administration</h1>
        <p className="subtle">
          Review new registrations and control who can access shared features such as the leaderboard.
        </p>
      </div>
      <UserManagement
        initialUsers={users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
