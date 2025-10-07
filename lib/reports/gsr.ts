import { loadGsrMapping, type GsrMapping } from "./gsrMapping";
import { candidateNarrative, normalizeCeremony } from "./gsrNarrative";
import type {
  CandidateBlock,
  Ceremony,
  ProgressEvent,
  ReportModel,
  Summary,
} from "./gsrTypes";

type PrismaLike = {
  [key: string]: any;
};

type BuildReportOptions = {
  from: Date;
  to: Date;
  lodgeId?: string | null;
  prisma?: PrismaLike;
};

let prismaClientPromise: Promise<PrismaLike> | null = null;

async function resolvePrisma(prisma?: PrismaLike) {
  if (prisma) return prisma;
  if (!prismaClientPromise) {
    prismaClientPromise = import("@/lib/db").then((mod) => mod.db as PrismaLike);
  }
  return prismaClientPromise;
}

function combineNotes(...notes: Array<string | null | undefined>) {
  const filtered = notes
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  return filtered.length > 0 ? filtered.join(" | ") : undefined;
}

function candidateNameFromMapping(mapping: GsrMapping, candidate: any) {
  const pieces = mapping.candidate.nameFields
    .map((field) => candidate?.[field])
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
  return pieces.join(" ") || "Unnamed Candidate";
}

function extractWmInfo(lodge: any) {
  const allEntries = Object.entries(lodge ?? {}) as Array<[string, unknown]>;
  const stringEntries = allEntries.filter(([, value]) => typeof value === "string" && value);
  const wmEntry =
    stringEntries.find(([key]) => /(wm|master|superintendent).*name/i.test(key)) ??
    stringEntries.find(([key]) => /(wm|master|superintendent)/i.test(key));
  const postEntry =
    stringEntries.find(([key]) => /(postnom|post_nom|postNom|letters|suffix)/i.test(key)) ?? null;
  return {
    wmName: (wmEntry?.[1] as string) ?? "Not provided",
    wmPostNominals: (postEntry?.[1] as string) ?? null,
  };
}

function ensureDate(value: any) {
  if (value instanceof Date) return value;
  return new Date(value);
}

function toId(value: any) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function summarizeCandidates(blocks: CandidateBlock[]) {
  let initiations = 0;
  let passings = 0;
  let raisings = 0;
  let affiliations = 0;
  let awaitingPassing = 0;
  let awaitingRaising = 0;

  for (const block of blocks) {
    let hasInitiation = false;
    let hasPassing = false;
    let hasRaising = false;
    for (const event of block.timeline) {
      const canonical = normalizeCeremony(event.ceremony);
      switch (canonical) {
        case "INITIATION":
          initiations += 1;
          hasInitiation = true;
          break;
        case "PASSING":
          passings += 1;
          hasPassing = true;
          break;
        case "RAISING":
          raisings += 1;
          hasRaising = true;
          break;
        case "AFFILIATION":
          affiliations += 1;
          break;
        default:
          break;
      }
    }
    if (hasInitiation && !hasPassing) awaitingPassing += 1;
    if (hasPassing && !hasRaising) awaitingRaising += 1;
  }

  return {
    totalCandidates: blocks.length,
    initiations,
    passings,
    raisings,
    affiliations,
    awaitingPassing,
    awaitingRaising,
  } satisfies Summary;
}

function buildProgressEvent(
  mapping: GsrMapping,
  working: any,
  join: any,
  lodge: any
): ProgressEvent {
  const ceremonyRaw = join?.[mapping.candidateWorking.ceremony] as string | null | undefined;
  const resultRaw = mapping.candidateWorking.result
    ? (join?.[mapping.candidateWorking.result] as string | null | undefined)
    : undefined;
  const remarksRaw = mapping.candidateWorking.remarks
    ? (join?.[mapping.candidateWorking.remarks] as string | null | undefined)
    : undefined;
  const workingNotes = mapping.working.notes
    ? (working?.[mapping.working.notes] as string | null | undefined)
    : undefined;
  const notes = combineNotes(remarksRaw, workingNotes);

  return {
    date: ensureDate(working?.[mapping.working.date]),
    ceremony: normalizeCeremony(ceremonyRaw ?? undefined),
    lodgeName: lodge ? String(lodge?.[mapping.lodge.name] ?? "") : "",
    result: resultRaw ?? null,
    notes: notes ?? null,
  };
}

export async function buildGsrReport({
  from,
  to,
  lodgeId,
  prisma,
}: BuildReportOptions): Promise<{ report: ReportModel; mapping: GsrMapping }> {
  const mapping = await loadGsrMapping();
  const joinModelName = mapping.candidateWorking.model;
  const workingRelName = mapping.candidateWorking.workingRel;
  const candidateRelName = mapping.candidateWorking.candidateRel;
  const workingModelName = mapping.working.model;
  const lodgeRelName = mapping.working.lodgeRel;

  const prismaClient = await resolvePrisma(prisma);
  const joinDelegate = prismaClient[joinModelName];
  if (!joinDelegate) {
    throw new Error(`Prisma delegate ${joinModelName} is not available on the client`);
  }

  const workingFilter: Record<string, any> = {
    [mapping.working.date]: {
      gte: from,
      lte: to,
    },
  };

  if (lodgeId) {
    workingFilter[lodgeRelName] = {
      is: {
        [mapping.lodge.id]: lodgeId,
      },
    };
  }

  const where = {
    [workingRelName]: {
      is: workingFilter,
    },
  };

  const include = {
    [candidateRelName]: true,
    [workingRelName]: {
      include: {
        [lodgeRelName]: true,
      },
    },
  };

  const orderBy = {
    [workingRelName]: {
      [mapping.working.date]: "asc",
    },
  };

  const joinRecords: any[] = await joinDelegate.findMany({
    where,
    include,
    orderBy,
  });

  const candidateMap = new Map<string, CandidateBlock>();
  const appendixRows: ReportModel["appendix"]["rows"] = [];
  const lodges = new Map<string, any>();

  for (const record of joinRecords) {
    const candidate = record?.[candidateRelName];
    const working = record?.[workingRelName];
    if (!candidate || !working) continue;
    const lodge = working?.[lodgeRelName];
    if (lodge) {
      const lodgeKey = toId(lodge?.[mapping.lodge.id]);
      if (lodgeKey) lodges.set(lodgeKey, lodge);
    }

    const candidateId = toId(candidate?.[mapping.candidate.id]);
    const name = candidateNameFromMapping(mapping, candidate);
    const membershipNumber = mapping.candidate.membershipNumber
      ? (candidate?.[mapping.candidate.membershipNumber] as string | null | undefined) ?? null
      : undefined;

    if (!candidateMap.has(candidateId)) {
      candidateMap.set(candidateId, {
        id: candidateId,
        name,
        membershipNumber: membershipNumber ?? undefined,
        timeline: [],
      });
    }

    const block = candidateMap.get(candidateId)!;
    const event = buildProgressEvent(mapping, working, record, lodge);
    block.timeline.push(event);

    const appendixRow = {
      date: ensureDate(working?.[mapping.working.date]),
      lodge: lodge ? String(lodge?.[mapping.lodge.name] ?? "") : "",
      ceremony: typeof record?.[mapping.candidateWorking.ceremony] === "string"
        ? (record?.[mapping.candidateWorking.ceremony] as string)
        : String(record?.[mapping.candidateWorking.ceremony] ?? event.ceremony ?? ""),
      candidates: name,
      result: mapping.candidateWorking.result
        ? (record?.[mapping.candidateWorking.result] as string | null | undefined) ?? null
        : null,
      notes: combineNotes(
        mapping.candidateWorking.remarks
          ? (record?.[mapping.candidateWorking.remarks] as string | null | undefined)
          : undefined,
        mapping.working.notes ? (working?.[mapping.working.notes] as string | null | undefined) : undefined
      ),
    };
    appendixRows.push(appendixRow);
  }

  const candidates = Array.from(candidateMap.values()).map((block) => {
    block.timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
    return block;
  });

  const summary = summarizeCandidates(candidates);
  appendixRows.sort((a, b) => a.date.getTime() - b.date.getTime());

  let primaryLodge = lodgeId
    ? lodges.get(lodgeId)
    : lodges.size === 1
    ? Array.from(lodges.values())[0]
    : null;

  if (!primaryLodge && lodgeId) {
    const lodgeDelegate = (prismaClient as PrismaLike)[mapping.lodge.model];
    if (lodgeDelegate?.findUnique) {
      try {
        primaryLodge = await lodgeDelegate.findUnique({
          where: { [mapping.lodge.id]: lodgeId },
        });
      } catch (error) {
        console.warn("Failed to load lodge information", error);
      }
    }
  }

  let lodgeName: string;
  let lodgeNumber: string | null | undefined;
  if (primaryLodge) {
    lodgeName = String(primaryLodge?.[mapping.lodge.name] ?? "");
    lodgeNumber = mapping.lodge.number
      ? (primaryLodge?.[mapping.lodge.number] as string | number | null | undefined)?.toString() ?? null
      : null;
  } else if (lodgeId) {
    lodgeName = "Selected Lodge";
    lodgeNumber = null;
  } else {
    lodgeName = "All Lodges";
    lodgeNumber = null;
  }

  const wmInfo = primaryLodge ? extractWmInfo(primaryLodge) : { wmName: "Not provided", wmPostNominals: null };

  const report: ReportModel = {
    lodgeName,
    lodgeNumber,
    from,
    to,
    wmName: wmInfo.wmName,
    wmPostNominals: wmInfo.wmPostNominals ?? undefined,
    summary,
    candidates,
    appendix: { rows: appendixRows },
  };

  return { report, mapping };
}

export { candidateNarrative, normalizeCeremony } from "./gsrNarrative";
export type { Ceremony, ProgressEvent, CandidateBlock, Summary, ReportModel } from "./gsrTypes";

