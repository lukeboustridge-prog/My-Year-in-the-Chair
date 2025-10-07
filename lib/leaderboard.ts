import { db } from "./db";

export type LeaderboardEntry = {
  userId: string;
  name: string;
  visits: number;
  rank: number;
};

function formatDisplayName(user: { prefix?: string | null; name?: string | null; postNominals?: string[] | null } | undefined) {
  if (!user) return "Member";
  const parts: string[] = [];
  if (user.prefix) parts.push(user.prefix);
  if (user.name) parts.push(user.name);
  const pn = Array.isArray(user.postNominals) ? user.postNominals.filter(Boolean) : [];
  if (pn.length) {
    const lastIndex = parts.length - 1;
    if (lastIndex >= 0) {
      parts[lastIndex] = `${parts[lastIndex]} ${pn.join(", ")}`;
    } else {
      parts.push(pn.join(", "));
    }
  }
  return parts.join(" ") || "Member";
}

function ranking(entries: Array<{ userId: string; name: string; visits: number }>): LeaderboardEntry[] {
  const sorted = entries.sort((a, b) => {
    if (b.visits !== a.visits) return b.visits - a.visits;
    return a.name.localeCompare(b.name);
  });
  let lastCount: number | null = null;
  let lastRank = 0;
  return sorted.map((entry, index) => {
    if (lastCount === null || entry.visits !== lastCount) {
      lastRank = index + 1;
      lastCount = entry.visits;
    }
    return { ...entry, rank: lastRank };
  });
}

export async function getVisitLeaderboard(range: "month" | "year") {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const now = new Date();
  const start = range === "month"
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  let visitUsers: Array<{ userId: string }>;
  try {
    visitUsers = await db.visit.findMany({
      where: { date: { gte: start } },
      select: { userId: true },
    });
  } catch (error) {
    console.warn("Failed to load visit leaderboard", error);
    return [];
  }

  if (!visitUsers.length) return [] as LeaderboardEntry[];

  const grouped = visitUsers.reduce<Record<string, number>>((acc, visit) => {
    acc[visit.userId] = (acc[visit.userId] || 0) + 1;
    return acc;
  }, {});

  const users = await db.user.findMany({
    where: { id: { in: Object.keys(grouped) } },
    select: { id: true, prefix: true, name: true, postNominals: true },
  });
  const lookup = new Map(users.map((u) => [u.id, u]));

  const entries = Object.entries(grouped).map(([userId, visits]) => ({
    userId,
    name: formatDisplayName(lookup.get(userId)),
    visits,
  }));

  return ranking(entries);
}
