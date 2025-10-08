import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import type PDFKit from "pdfkit";
import { PassThrough } from "node:stream";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";

import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { deriveTitle } from "@/lib/constants";
import type { MyWork, Visit } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_LOCALE = "en-NZ";

type PeriodSource = "term" | "custom";

type ReportPeriod = {
  start: Date;
  end: Date;
  label: string;
  mode: PeriodSource;
};

const WORK_LABELS: Record<string, string> = {
  INITIATION: "First Degree",
  PASSING: "Second Degree",
  RAISING: "Third Degree",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Other",
};

const WORK_PRIORITY: Record<string, number> = {
  INITIATION: 1,
  PASSING: 2,
  RAISING: 3,
  INSTALLATION: 4,
  PRESENTATION: 5,
  LECTURE: 0,
  OTHER: 0,
};

const STATUS_LABELS: Record<string, string> = {
  INITIATION: "Advanced to the First Degree",
  PASSING: "Advanced to the Second Degree",
  RAISING: "Raised to the Third Degree",
  INSTALLATION: "Installed",
  PRESENTATION: "Presentation completed",
  LECTURE: "Lecture delivered",
  OTHER: "Working recorded",
};

function coerceWorkType(value?: string | null) {
  if (typeof value !== "string" || !value.trim()) return "OTHER";
  const normalised = value.trim().toUpperCase();
  return WORK_LABELS[normalised] ? normalised : "OTHER";
}

function workLabel(value?: string | null) {
  const coerced = coerceWorkType(value);
  return WORK_LABELS[coerced] ?? coerced.replace(/_/g, " ");
}

function safeDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function lodgeDisplay(name?: string | null, number?: string | null) {
  const parts = [name?.trim() || "", number?.trim() ? `No. ${number.trim()}` : ""].filter(Boolean);
  return parts.join(" ");
}

function normalise(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function compareWorkPriority(a: MyWork, b: MyWork) {
  const pa = WORK_PRIORITY[coerceWorkType(a.work)] ?? 0;
  const pb = WORK_PRIORITY[coerceWorkType(b.work)] ?? 0;
  if (pa !== pb) return pa - pb;
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function resolveTimeZone() {
  const candidates = [process.env.REPORT_TIMEZONE, process.env.USER_TIMEZONE].filter(
    (value): value is string => Boolean(value && value.trim())
  );

  for (const candidate of candidates) {
    try {
      new Intl.DateTimeFormat(DEFAULT_LOCALE, { timeZone: candidate }).format(new Date());
      return candidate;
    } catch (error) {
      console.warn("REPORT_TZ_INVALID", candidate, error);
    }
  }

  try {
    const fallback = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (fallback) {
      new Intl.DateTimeFormat(DEFAULT_LOCALE, { timeZone: fallback }).format(new Date());
      return fallback;
    }
  } catch (error) {
    console.warn("REPORT_TZ_RESOLVE", error);
  }

  return "UTC";
}

function formatDate(date: Date, timeZone: string, includeTime = false) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
    timeZone,
  }).format(date);
}

function formatForFilename(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

async function collectPdf(doc: PDFKit.PDFDocument) {
  const stream = doc.pipe(new PassThrough());
  return new Promise<Uint8Array>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk: Uint8Array | Buffer) => {
      const normalized = Buffer.isBuffer(chunk)
        ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
        : chunk;
      chunks.push(normalized);
    });
    stream.on("end", () => {
      const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      resolve(merged);
    });
    stream.on("error", reject);
    doc.on("error", reject);
  });
}

async function resolveLogoBuffer() {
  const configured = process.env.ORG_LOGO_PATH || process.env.ORG_LOGO_URL || null;
  const fallback = process.env.FMNZ_LOGO_URL || null;
  const candidates = [configured, fallback].filter(Boolean) as string[];

  for (const source of candidates) {
    try {
      if (source.startsWith("http")) {
        const response = await fetch(source);
        if (!response.ok) continue;
        const contentType = response.headers.get("content-type") || "";
        if (!/(png|jpe?g)/i.test(contentType)) continue;
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length) return buffer;
      } else {
        const absolute = path.isAbsolute(source) ? source : path.join(process.cwd(), source);
        if (!fs.existsSync(absolute)) continue;
        const ext = path.extname(absolute).toLowerCase();
        if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") continue;
        const buffer = await fs.promises.readFile(absolute);
        if (buffer.length) return buffer;
      }
    } catch (error) {
      console.warn("REPORT_LOGO_RESOLVE", source, error);
    }
  }

  try {
    const publicDir = path.join(process.cwd(), "public");
    for (const candidate of ["logo.png", "logo.jpg", "logo.jpeg"]) {
      const filePath = path.join(publicDir, candidate);
      if (fs.existsSync(filePath)) {
        const buffer = await fs.promises.readFile(filePath);
        if (buffer.length) return buffer;
      }
    }
  } catch (error) {
    console.warn("REPORT_LOGO_FALLBACK", error);
  }

  return null;
}

async function ensureUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      rank: true,
      isPastGrand: true,
      prefix: true,
      postNominals: true,
      lodgeName: true,
      lodgeNumber: true,
      region: true,
      termStart: true,
      termEnd: true,
      role: true,
    },
  });

  if (!user) return null;
  const allowedRoles = new Set(["ADMIN", "USER"]);
  if (!allowedRoles.has(user.role ?? "")) {
    throw new NextResponse(
      "You do not have permission to generate this report. Please ask a Lodge Master or Administrator to run it.",
      { status: 403 }
    );
  }

  if (!user.lodgeName) {
    throw new NextResponse("Select an active lodge first. Update your lodge details in /profile to continue.", {
      status: 409,
    });
  }

  return user;
}

function resolvePreparedBy(user: Awaited<ReturnType<typeof ensureUser>>) {
  if (!user) return "";
  const derived = deriveTitle(user.rank ?? "Master Mason", Boolean(user.isPastGrand));
  const prefix = user.prefix?.trim() || derived.prefix;
  const postNominals = Array.isArray(user.postNominals) && user.postNominals.length > 0
    ? user.postNominals
    : derived.postNominals;
  const parts = [prefix, user.name?.trim() || "", postNominals.length ? postNominals.join(", ") : null].filter(Boolean);
  return parts.join(" ");
}

function resolvePeriod(user: Awaited<ReturnType<typeof ensureUser>>, request: NextRequest): ReportPeriod | NextResponse {
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const timezone = resolveTimeZone();
  const params = request.nextUrl.searchParams;
  const mode = params.get("period");
  const from = params.get("from");
  const to = params.get("to");
  const termConfirm = params.get("term");

  if (mode === "custom") {
    if (!from || !to) {
      return new NextResponse("Provide both from and to dates for a custom period.", { status: 400 });
    }
    const start = safeDate(`${from}T00:00:00`);
    const end = safeDate(`${to}T23:59:59`);
    if (!start || !end) {
      return new NextResponse("Invalid custom period. Use ISO date values (YYYY-MM-DD).", { status: 400 });
    }
    if (start > end) {
      return new NextResponse("The start of the custom period must be before the end.", { status: 400 });
    }
    return {
      start,
      end,
      mode: "custom",
      label: `${formatDate(start, timezone)} – ${formatDate(end, timezone)}`,
    };
  }

  const termStart = safeDate(user.termStart);
  const termEnd = safeDate(user.termEnd);
  if (!termStart || !termEnd) {
    return new NextResponse("Add your current term dates in /profile before generating the report.", { status: 409 });
  }
  if (termStart > termEnd) {
    return new NextResponse("Your term dates look invalid. Please correct them in /profile.", { status: 409 });
  }

  const now = new Date();
  const insideTerm = now >= termStart && now <= termEnd;
  if (!insideTerm && termConfirm !== "current") {
    return new NextResponse(
      "Today is outside your stored term. Choose the current term from /profile or pass term=current to confirm.",
      { status: 409 }
    );
  }

  return {
    start: termStart,
    end: termEnd,
    mode: "term",
    label: `${formatDate(termStart, timezone)} – ${formatDate(termEnd, timezone)}`,
  };
}

function matchVisitToLodge(visit: Visit, lodgeName?: string | null, lodgeNumber?: string | null) {
  const visitName = normalise(visit.lodgeName);
  const userName = normalise(lodgeName);
  const visitNumber = (visit.lodgeNumber ?? "").replace(/[^0-9A-Za-z]/g, "");
  const userNumber = (lodgeNumber ?? "").replace(/[^0-9A-Za-z]/g, "");

  if (!userName && !userNumber) return true;
  if (userNumber && visitNumber && visitNumber === userNumber) return true;
  if (userName && visitName && visitName === userName) return true;
  return false;
}

async function loadActivity(userId: string, period: ReportPeriod) {
  const [works, visits] = await Promise.all([
    db.myWork.findMany({
      where: {
        userId,
        date: { gte: period.start, lte: period.end },
      },
      orderBy: { date: "asc" },
    }),
    db.visit.findMany({
      where: {
        userId,
        date: { gte: period.start, lte: period.end },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  return { works, visits };
}

function summariseCandidates(works: MyWork[], timezone: string, lodgeLabel: string) {
  const candidateEvents = works.filter((row) => normalise(row.candidateName).length > 0);
  const summary = new Map<string, MyWork>();
  const displayNames = new Map<string, string>();

  for (const event of candidateEvents) {
    const key = normalise(event.candidateName);
    if (!key) continue;
    displayNames.set(key, event.candidateName!.trim());
    const existing = summary.get(key);
    if (!existing) {
      summary.set(key, event);
      continue;
    }
    const comparison = compareWorkPriority(existing, event);
    if (comparison < 0) {
      summary.set(key, event);
    } else if (comparison === 0) {
      if (new Date(existing.date).getTime() < new Date(event.date).getTime()) {
        summary.set(key, event);
      }
    }
  }

  return Array.from(summary.entries())
    .map(([key, event]) => ({
      candidate: displayNames.get(key) ?? event.candidateName ?? "",
      event,
      displayDate: formatDate(new Date(event.date), timezone),
      ceremony: workLabel(event.work),
      lodge: lodgeLabel,
      result: STATUS_LABELS[coerceWorkType(event.work)] ?? STATUS_LABELS.OTHER,
      notes: event.comments?.trim() || "None recorded",
    }))
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());
}

function summariseEmergencyMeetings(works: MyWork[], timezone: string) {
  return works
    .filter((row) => Boolean(row.isEmergencyMeeting))
    .map((meeting) => ({
      date: formatDate(new Date(meeting.date), timezone),
      purpose: workLabel(meeting.work),
      candidate: meeting.candidateName?.trim() || "None recorded",
      notes: meeting.comments?.trim() || "None recorded",
    }));
}

function summariseGrandLodgeVisits(visits: Visit[], timezone: string) {
  return visits
    .filter((visit) => Boolean(visit.isGrandLodgeVisit))
    .map((visit) => ({
      date: formatDate(new Date(visit.date), timezone),
      officer:
        visit.candidateName?.trim() ||
        visit.comments?.trim() ||
        visit.notes?.trim() ||
        "Officer not recorded",
      occasion: workLabel(visit.workOfEvening),
      notes: visit.notes?.trim() || visit.comments?.trim() || "None recorded",
    }));
}

function summariseOtherVisits(visits: Visit[], timezone: string, lodgeLabel: string) {
  return visits
    .filter((visit) => !visit.isGrandLodgeVisit)
    .map((visit) => ({
      date: formatDate(new Date(visit.date), timezone),
      lodge: lodgeDisplay(visit.lodgeName, visit.lodgeNumber) || lodgeLabel || "Not recorded",
      event: workLabel(visit.workOfEvening),
      notes: visit.notes?.trim() || visit.comments?.trim() || "None recorded",
    }));
}

function summariseWorkings(works: MyWork[], timezone: string) {
  return works
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((row) => {
      const tags: string[] = [];
      if (row.isGrandLodgeVisit) tags.push("Grand Lodge representation");
      if (row.isEmergencyMeeting) tags.push("Emergency meeting");
      if (row.hasFirstTracingBoard || row.hasSecondTracingBoard || row.hasThirdTracingBoard) {
        const boards: string[] = [];
        if (row.hasFirstTracingBoard) boards.push("1st tracing board");
        if (row.hasSecondTracingBoard) boards.push("2nd tracing board");
        if (row.hasThirdTracingBoard) boards.push("3rd tracing board");
        tags.push(boards.join(", "));
      }
      if (!tags.length) tags.push("Recorded");
      return {
        date: formatDate(new Date(row.date), timezone),
        type: workLabel(row.work),
        purpose: row.comments?.trim() || "None recorded",
        candidate: row.candidateName?.trim() || "None recorded",
        result: tags.join(" • "),
      };
    });
}

function renderSection(doc: PDFKit.PDFDocument, title: string, rows: Array<() => void> | (() => void)[], emptyMessage: string) {
  doc.moveDown();
  doc.fontSize(13).text(title, { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  if (!rows.length) {
    doc.text(emptyMessage);
    return;
  }
  rows.forEach((render) => render());
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await ensureUser(userId);
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const period = resolvePeriod(user, request);
    if (period instanceof NextResponse) return period;

    const timezone = resolveTimeZone();
    const { works, visits } = await loadActivity(userId, period);

    const lodgeLabel = lodgeDisplay(user.lodgeName, user.lodgeNumber);
    const preparedAt = formatDate(new Date(), timezone, true);
    const preparedBy = resolvePreparedBy(user);

    const relevantVisits = visits.filter((visit) => matchVisitToLodge(visit, user.lodgeName, user.lodgeNumber));
    const grandLodgeVisits = summariseGrandLodgeVisits(relevantVisits, timezone);
    const otherVisits = summariseOtherVisits(relevantVisits, timezone, lodgeLabel);
    const emergencyMeetings = summariseEmergencyMeetings(works, timezone);
    const candidateRows = summariseCandidates(works, timezone, lodgeLabel);
    const workingRows = summariseWorkings(works, timezone);

    const workingCountByType = works.reduce<Record<string, number>>((acc, work) => {
      const key = coerceWorkType(work.work);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const logoBuffer = await resolveLogoBuffer();
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const pdfPromise = collectPdf(doc);

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, { fit: [120, 60] });
        doc.moveDown(0.5);
      } catch (error) {
        console.warn("REPORT_LOGO_RENDER", error);
      }
    }

    doc.fontSize(18).text("Grand Superintendent of Region Report");
    if (user.region) {
      doc.fontSize(12).text(`${user.region} • ${lodgeLabel}`);
    } else {
      doc.fontSize(12).text(lodgeLabel);
    }

    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Region: ${user.region ?? "Not recorded"}`);
    doc.text(`Lodge: ${lodgeLabel || "Not recorded"}`);
    doc.text(`Prepared by: ${preparedBy || "Not recorded"}`);
    doc.text(`Date of preparation: ${preparedAt}`);
    doc.text(`Reporting period: ${period.label}${period.mode === "custom" ? " (Custom period)" : ""}`);

    doc.moveDown();
    doc.fontSize(13).text("Executive summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Total lodge workings in period: ${works.length}`);
    if (works.length) {
      Object.entries(workingCountByType)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
          doc.text(` • ${workLabel(type)}: ${count}`);
        });
    }
    doc.text(`Emergency meetings in period: ${emergencyMeetings.length}`);
    doc.text(`Grand Lodge visits in period: ${grandLodgeVisits.length}`);

    renderSection(
      doc,
      "Candidate progress",
      candidateRows.map((row, index) => () => {
        doc.text(`${index + 1}. ${row.candidate || "Candidate"}`);
        doc.text(`    Date: ${row.displayDate}`);
        doc.text(`    Ceremony: ${row.ceremony}`);
        doc.text(`    Lodge: ${row.lodge}`);
        doc.text(`    Result: ${row.result}`);
        doc.text(`    Notes: ${row.notes}`);
        doc.moveDown(0.4);
      }),
      "No records in the reporting period."
    );

    renderSection(
      doc,
      "Emergency meetings",
      emergencyMeetings.map((meeting, index) => () => {
        doc.text(`${index + 1}. ${meeting.date}`);
        doc.text(`    Purpose: ${meeting.purpose}`);
        doc.text(`    Candidate: ${meeting.candidate}`);
        doc.text(`    Notes: ${meeting.notes}`);
        doc.moveDown(0.4);
      }),
      "No records in the reporting period."
    );

    renderSection(
      doc,
      "Grand Lodge visits",
      grandLodgeVisits.map((visit, index) => () => {
        doc.text(`${index + 1}. ${visit.date}`);
        doc.text(`    Visiting officer: ${visit.officer}`);
        doc.text(`    Occasion: ${visit.occasion}`);
        doc.text(`    Notes: ${visit.notes}`);
        doc.moveDown(0.4);
      }),
      "No records in the reporting period."
    );

    renderSection(
      doc,
      "Visits summary",
      otherVisits.map((visit, index) => () => {
        doc.text(`${index + 1}. ${visit.date}`);
        doc.text(`    Lodge: ${visit.lodge}`);
        doc.text(`    Event: ${visit.event}`);
        doc.text(`    Notes: ${visit.notes}`);
        doc.moveDown(0.4);
      }),
      "No records in the reporting period."
    );

    renderSection(
      doc,
      "Lodge workings summary",
      workingRows.map((row, index) => () => {
        doc.text(`${index + 1}. ${row.date}`);
        doc.text(`    Working: ${row.type}`);
        doc.text(`    Purpose: ${row.purpose}`);
        doc.text(`    Candidate: ${row.candidate}`);
        doc.text(`    Result: ${row.result}`);
        doc.moveDown(0.4);
      }),
      "No records in the reporting period."
    );

    doc.end();
    const pdfBytes = await pdfPromise;
    const pdfBuffer = Buffer.from(pdfBytes);

    const lodgeIdentifier = user.lodgeNumber?.trim()
      ? user.lodgeNumber.trim().replace(/\s+/g, "-")
      : (user.lodgeName || "lodge").trim().replace(/[^A-Za-z0-9]+/g, "-") || "lodge";

    const filename = `GSR_${lodgeIdentifier}_${formatForFilename(period.start)}_${formatForFilename(period.end)}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("REPORT_GSR_FAILURE", error);
    if (error instanceof NextResponse) return error;
    return new NextResponse(
      "Unable to generate the PDF report. Please try again or review your lodge data for missing details.",
      { status: 500 }
    );
  }
}
