import { db } from "./db";

export type LeaderboardUser = {
  id: string;
  prefix: string | null;
  name: string | null;
  postNominals: string[];
  lodgeName: string | null;
  lodgeNumber: string | null;
};

export function formatDisplayName(user?: LeaderboardUser): string {
  if (!user) return "Unknown";
  const parts: string[] = [];
  if (user.prefix) parts.push(user.prefix);
  if (user.name) parts.push(user.name);
  return parts.join(" ") || "Unknown";
}

export function formatPostNominals(user?: LeaderboardUser): string {
  return user?.postNominals?.length ? user.postNominals.join(", ") : "";
}

export function formatLodge(user?: LeaderboardUser): string {
  if (!user?.lodgeName) return "";
  return `${user.lodgeName}${user.lodgeNumber ? ` No. ${user.lodgeNumber}` : ""}`;
}

export async function fetchUsersById(ids: string[]): Promise<Map<string, LeaderboardUser>> {
  if (ids.length === 0) return new Map();
  const unique = Array.from(new Set(ids));
  const users = await db.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, prefix: true, name: true, postNominals: true, lodgeName: true, lodgeNumber: true },
  });
  return new Map(users.map((user) => [user.id, user]));
}
