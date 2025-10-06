import { db } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

type SessionPayload = {
  userId?: string;
  id?: string;
  [key: string]: unknown;
};

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + "=".repeat(padding), "base64");
}

function verifyJwt(token: string, secret: string): SessionPayload | null {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const headerJson = base64UrlDecode(headerB64).toString("utf8");
    const header = JSON.parse(headerJson) as { alg?: string };
    if (header.alg && header.alg !== "HS256") return null;

    const payloadJson = base64UrlDecode(payloadB64).toString("utf8");
    const payload = JSON.parse(payloadJson) as SessionPayload;

    const data = `${headerB64}.${payloadB64}`;
    const expected = createHmac("sha256", secret).update(data).digest();
    const actual = base64UrlDecode(signatureB64);

    if (expected.length !== actual.length) return null;
    if (!timingSafeEqual(expected, actual)) return null;

    return payload;
  } catch {
    return null;
  }
}

function parseDevToken(token: string): SessionPayload | null {
  if (!token.startsWith("dev.")) return null;
  try {
    const data = base64UrlDecode(token.slice(4)).toString("utf8");
    return JSON.parse(data) as SessionPayload;
  } catch {
    return null;
  }
}

function getUserId(): string | null {
  const cookie = cookies().get("myyitc_session") ?? cookies().get("session");
  if (!cookie) return null;

  const secret = process.env.JWT_SECRET;
  if (secret) {
    const payload = verifyJwt(cookie.value, secret);
    if (payload) {
      const id = payload.userId ?? payload.id;
      return typeof id === "string" ? id : null;
    }
  }

  const devPayload = parseDevToken(cookie.value);
  if (devPayload) {
    const id = devPayload.userId ?? devPayload.id;
    return typeof id === "string" ? id : "dev-user";
  }

  return null;
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
