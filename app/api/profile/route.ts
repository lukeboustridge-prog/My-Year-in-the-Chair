import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ACHIEVEMENT_MILESTONES,
  type LodgeRecord,
  type OfficeRecord,
} from "@/lib/myFreemasonry";

const ACHIEVEMENT_KEYS = ACHIEVEMENT_MILESTONES.map((milestone) => milestone.key);

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseOffices(value: unknown): OfficeRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const officeRaw = (entry as { office?: unknown }).office;
      const yearsRaw = (entry as { years?: unknown }).years;
      const lodgeIdRaw = (entry as { lodgeId?: unknown }).lodgeId;
      const office = typeof officeRaw === "string" ? officeRaw.trim() : "";
      const years = typeof yearsRaw === "string" ? yearsRaw.trim() : "";
      const lodgeId = typeof lodgeIdRaw === "string" && lodgeIdRaw ? lodgeIdRaw : null;
      if (!office && !years) return null;
      const record: OfficeRecord = { office };
      if (years) record.years = years;
      if (lodgeId) record.lodgeId = lodgeId;
      return record;
    })
    .filter((entry): entry is OfficeRecord => Boolean(entry));
}

function parseLodges(value: unknown): LodgeRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const idRaw = (entry as { id?: unknown }).id;
      const nameRaw = (entry as { name?: unknown }).name;
      const numberRaw = (entry as { number?: unknown }).number;
      const joinDateRaw = (entry as { joinDate?: unknown }).joinDate;
      const resignDateRaw = (entry as { resignDate?: unknown }).resignDate;

      const id = typeof idRaw === "string" && idRaw ? idRaw : null;
      const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
      const number = typeof numberRaw === "string" ? numberRaw.trim() : "";
      const joinDate = typeof joinDateRaw === "string" && joinDateRaw ? joinDateRaw : null;
      const resignDate =
        typeof resignDateRaw === "string" && resignDateRaw ? resignDateRaw : null;

      if (!id || (!name && !number)) return null;

      const record: LodgeRecord = { id, name, number: number || null };
      if (joinDate) record.joinDate = joinDate;
      if (resignDate) record.resignDate = resignDate;
      return record;
    })
    .filter((entry): entry is LodgeRecord => Boolean(entry));
}

function parseAchievementMilestones(value: unknown) {
  const result: Record<string, string | null> = {};
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of ACHIEVEMENT_KEYS) {
      const raw = (value as Record<string, unknown>)[key];
      result[key] = typeof raw === "string" && raw ? raw : null;
    }
  } else {
    for (const key of ACHIEVEMENT_KEYS) {
      result[key] = null;
    }
  }
  return result;
}

export async function GET() {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const u = await db.user.findUnique({ where: { id: uid } });
  if (!u) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json({
    name: u.name,
    rank: u.rank,
    isPastGrand: u.isPastGrand,
    isSittingMaster: u.isSittingMaster,
    prefix: u.prefix,
    postNominals: u.postNominals,
    lodgeName: u.lodgeName,
    lodgeNumber: u.lodgeNumber,
    region: u.region,
    termStart: u.termStart ? u.termStart.toISOString() : null,
    termEnd: u.termEnd ? u.termEnd.toISOString() : null,
    initiationDate: u.initiationDate ? u.initiationDate.toISOString() : null,
    passingDate: u.passingDate ? u.passingDate.toISOString() : null,
    raisingDate: u.raisingDate ? u.raisingDate.toISOString() : null,
    lodges: u.lodges ?? [],
    craftOffices: u.craftOffices ?? [],
    grandOffices: u.grandOffices ?? [],
    achievementMilestones: u.achievementMilestones ?? {},
  });
}

export async function PUT(req: Request) {
  const uid = getUserId();
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json();

  const termStart = parseDate(body.termStart);
  const termEnd = parseDate(body.termEnd);
  const initiationDate = parseDate(body.initiationDate);
  const passingDate = parseDate(body.passingDate);
  const raisingDate = parseDate(body.raisingDate);
  const lodges = parseLodges(body.lodges);
  const craftOffices = parseOffices(body.craftOffices);
  const grandOffices = parseOffices(body.grandOffices);
  const achievementMilestones = parseAchievementMilestones(body.achievementMilestones);

  await db.user.update({
    where: { id: uid },
    data: {
      name: body.name ?? null,
      rank: body.rank ?? null,
      isPastGrand: Boolean(body.isPastGrand),
      isSittingMaster: Boolean(body.isSittingMaster),
      prefix: body.prefix ?? null,
      postNominals: Array.isArray(body.postNominals) ? body.postNominals : [],
      lodgeName: body.lodgeName ?? null,
      lodgeNumber: body.lodgeNumber ?? null,
      region: body.region ?? null,
      termStart,
      termEnd,
      initiationDate,
      passingDate,
      raisingDate,
      lodges: lodges as Prisma.JsonArray,
      craftOffices: craftOffices as Prisma.JsonArray,
      grandOffices: grandOffices as Prisma.JsonArray,
      achievementMilestones: achievementMilestones as Prisma.JsonObject,
    },
  });

  return NextResponse.json({ ok: true });
}
