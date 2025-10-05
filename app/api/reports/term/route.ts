import { db } from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

function getUserId(): string | null {
  const c = cookies().get("myyitc_session");
  if (!c) return null;
  try {
    const data = jwt.verify(c.value, process.env.JWT_SECRET || "");
    // @ts-ignore
    return data?.userId ?? null;
  } catch {
    return null;
  }
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return "\""+s.replaceAll("\"", "\"")+"\"";
  }
  return s;
}

export async function GET() {
  const userId = getUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const now = new Date();
  // Use termStart/termEnd if set, otherwise default to last 12 months
  const start = user.termStart ?? new Date(now.getFullYear()-1, now.getMonth(), now.getDate());
  const end = user.termEnd ?? now;

  const visits = await db.visit.findMany({
    where: { userId, date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });

  const totalVisits = visits.length;
  const byLodge = new Map<string, number>();
  for (const v of visits) {
    const key = `${v.lodgeName} No. ${v.lodgeNumber}`;
    byLodge.set(key, (byLodge.get(key) || 0) + 1);
  }

  let csv = "";
  csv += "Master,Email,Term Start,Term End,Total Visits\n";
  csv += [user.name ?? "", user.email, start.toISOString(), end.toISOString(), totalVisits].map(csvEscape).join(",") + "\n\n";

  csv += "Date,Lodge,Number,Location,Notes\n";
  for (const v of visits) {
    csv += [
      v.date.toISOString(),
      v.lodgeName,
      v.lodgeNumber,
      v.location ?? "",
      (v.notes ?? "").replaceAll("\n", " ")
    ].map(csvEscape).join(",") + "\n";
  }

  csv += "\nVisits by Lodge\nLodge,Count\n";
  for (const [k, n] of byLodge.entries()) {
    csv += [k, n].map(csvEscape).join(",") + "\n";
  }

  const headers = new Headers({
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="master-report-${now.toISOString().slice(0,10)}.csv"`,
  });

  return new Response(csv, { status: 200, headers });
}
