import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import type PDFKit from "pdfkit";
import { PassThrough } from "node:stream";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import type { Visit, MyWork } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  return typeof value === "string" && value.trim().length ? value : "OTHER";
}

function workLabel(value?: string | null) {
  const key = coerceWorkType(value);
  return WORK_LABELS[key] ?? key.replace(/_/g, " ");
}

function normalise(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function safeDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const d = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const DEFAULT_LOCALE = "en-NZ";

function resolveTimeZone() {
  const candidates = [process.env.REPORT_TIMEZONE, process.env.USER_TIMEZONE].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
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

function asPeriodLabel(date: Date, timeZone: string, includeTime = false) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
    timeZone,
  }).format(date);
}

function formatForFilename(date: Date) {
  return date
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
}

function compareWorkPriority(a: MyWork, b: MyWork) {
  const pa = WORK_PRIORITY[coerceWorkType(a.work)] ?? 0;
  const pb = WORK_PRIORITY[coerceWorkType(b.work)] ?? 0;
  if (pa !== pb) return pa - pb;
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function lodgeDisplay(name?: string | null, number?: string | null) {
  const parts = [name?.trim() || "", number?.trim() ? `No. ${number.trim()}` : ""].filter(Boolean);
  return parts.join(" ");
}

function matchVisitToLodge(visit: Visit, userLodgeName?: string | null, userLodgeNumber?: string | null) {
  const visitName = normalise(visit.lodgeName);
  const userName = normalise(userLodgeName);
  const visitNumber = (visit.lodgeNumber ?? "").replace(/[^0-9A-Za-z]/g, "");
  const userNumber = (userLodgeNumber ?? "").replace(/[^0-9A-Za-z]/g, "");
  if (!userName && !userNumber) return true;
  if (userNumber && visitNumber) {
    if (visitNumber === userNumber) return true;
  }
  if (userName && visitName) {
    return visitName === userName;
  }
  return false;
}

async function resolveLogoBuffer() {
  const configured = process.env.ORG_LOGO_URL || process.env.ORG_LOGO_PATH || null;
  const fallback = process.env.FMNZ_LOGO_URL || null;
  const candidates = [configured, fallback].filter(Boolean) as string[];
  for (const source of candidates) {
    try {
      if (source.startsWith("http")) {
        const response = await fetch(source);
        if (!response.ok) continue;
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("png") && !contentType.includes("jpeg")) continue;
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length) return buffer;
      } else {
        const fullPath = path.isAbsolute(source) ? source : path.join(process.cwd(), source);
        if (!fs.existsSync(fullPath)) continue;
        const ext = path.extname(fullPath).toLowerCase();
        if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") continue;
        const buffer = await fs.promises.readFile(fullPath);
        if (buffer.length) return buffer;
      }
    } catch (error) {
      console.warn("REPORT_LOGO_RESOLVE", error);
    }
  }
  try {
    const fallbackPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(fallbackPath)) {
      return await fs.promises.readFile(fallbackPath);
    }
  } catch (error) {
    console.warn("REPORT_LOGO_FALLBACK", error);
  }
  return null;
}

function collectPdf(doc: PDFKit.PDFDocument) {
  const stream = doc.pipe(new PassThrough());
  return new Promise<Uint8Array>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk: Uint8Array) => {
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else {
        chunks.push(new Uint8Array(chunk));
      }
    });
    stream.on("end", () => {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const merged = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      resolve(merged);
    });
    stream.on("error", reject);
  });
}

export async function GET(request: Request) {
  try {
    const userId = getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
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

    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const allowedRoles = new Set(["ADMIN", "USER"]);
    if (!allowedRoles.has(user.role ?? "")) {
      return new NextResponse(
        "You do not have permission to generate this report. Please ask a Lodge Master or Administrator to run it.",
        { status: 403 }
      );
    }

    if (!user.lodgeName) {
      return new NextResponse("Select an active lodge first. Update your lodge details in /profile to continue.", {
        status: 409,
      });
    }

    const url = new URL(request.url);
    const periodMode = url.searchParams.get("period");
    const customFrom = url.searchParams.get("from");
    const customTo = url.searchParams.get("to");
    const termConfirm = url.searchParams.get("term");

    let periodStart: Date;
    let periodEnd: Date;
    let periodSource: "term" | "custom" = "term";

    if (periodMode === "custom") {
      if (!customFrom || !customTo) {
        return new NextResponse("Provide both from and to dates for a custom period.", { status: 400 });
      }
      const start = safeDate(`${customFrom}T00:00:00Z`);
      const end = safeDate(`${customTo}T23:59:59Z`);
      if (!start || !end) {
        return new NextResponse("Invalid custom period. Use ISO date values (YYYY-MM-DD).", { status: 400 });
      }
      if (start > end) {
        return new NextResponse("The start of the custom period must be before the end.", { status: 400 });
      }
      periodStart = start;
      periodEnd = end;
      periodSource = "custom";
    } else {
      const termStart = safeDate(user.termStart);
      const termEnd = safeDate(user.termEnd);
      if (!termStart || !termEnd) {
        return new NextResponse("Add your current term dates in /profile before generating the report.", {
          status: 409,
        });
      }
      if (termStart > termEnd) {
        return new NextResponse("Your term dates look invalid. Please correct them in /profile.", {
          status: 409,
        });
      }
      const now = new Date();
      const inTerm = now >= termStart && now <= termEnd;
      if (!inTerm && termConfirm !== "current") {
        return new NextResponse(
          "Today is outside your stored term. Choose the current term from /profile or pass term=current to confirm.",
          { status: 409 }
        );
      }
      periodStart = termStart;
      periodEnd = termEnd;
    }

    const [workings, visits] = await Promise.all([
      db.myWork.findMany({
        where: { userId, date: { gte: periodStart, lte: periodEnd } },
        orderBy: { date: "asc" },
      }),
      db.visit.findMany({
        where: { userId, date: { gte: periodStart, lte: periodEnd } },
        orderBy: { date: "asc" },
      }),
    ]);

    const lodgeLabel = lodgeDisplay(user.lodgeName, user.lodgeNumber);
    const timezone = resolveTimeZone();
    const preparedAt = new Date();
    const periodLabel = `${asPeriodLabel(periodStart, timezone)} – ${asPeriodLabel(periodEnd, timezone)}`;

    const preparedBy = [user.prefix?.trim(), user.name?.trim(), Array.isArray(user.postNominals) && user.postNominals.length > 0
      ? user.postNominals.join(", ")
      : null]
      .filter(Boolean)
      .join(" ");

    const workingTypeCounts = workings.reduce<Record<string, number>>((acc, row) => {
      const key = coerceWorkType(row.work);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const emergencyMeetings = workings.filter((row) => row.isEmergencyMeeting);

    const relevantVisits = visits.filter((visit) => matchVisitToLodge(visit, user.lodgeName, user.lodgeNumber));
    const grandLodgeVisits = relevantVisits.filter((visit) => visit.isGrandLodgeVisit);
    const otherVisits = relevantVisits.filter((visit) => !visit.isGrandLodgeVisit);

    const candidateEvents = workings.filter((row) => (row.candidateName ?? "").trim().length > 0);
    const candidateSummaryMap = new Map<string, MyWork>();
    const candidateNameMap = new Map<string, string>();
    for (const event of candidateEvents) {
      const key = normalise(event.candidateName);
      if (!key) continue;
      candidateNameMap.set(key, event.candidateName!.trim());
      const existing = candidateSummaryMap.get(key);
      if (!existing) {
        candidateSummaryMap.set(key, event);
        continue;
      }
      const comparison = compareWorkPriority(existing, event);
      if (comparison < 0) {
        candidateSummaryMap.set(key, event);
      } else if (comparison === 0) {
        if (new Date(existing.date).getTime() < new Date(event.date).getTime()) {
          candidateSummaryMap.set(key, event);
        }
      }
    }

    const candidateRows = Array.from(candidateSummaryMap.entries())
      .map(([key, event]) => ({
        candidate: candidateNameMap.get(key) ?? event.candidateName ?? "",
        event,
      }))
      .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());

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
    doc.text(`Date of preparation: ${asPeriodLabel(preparedAt, timezone, true)}`);
    doc.text(`Reporting period: ${periodLabel}${periodSource === "custom" ? " (Custom period)" : ""}`);

    doc.moveDown();
    doc.fontSize(13).text("Executive summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    const totalWorkings = workings.length;
    doc.text(`Total lodge workings in period: ${totalWorkings}`);
    if (totalWorkings > 0) {
      Object.entries(workingTypeCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
          const label = workLabel(type);
          doc.text(` • ${label}: ${count}`);
        });
    }
    doc.text(`Emergency meetings in period: ${emergencyMeetings.length}`);
    doc.text(`Grand Lodge visits in period: ${grandLodgeVisits.length}`);

    doc.moveDown();
    doc.fontSize(13).text("Candidate progress", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    if (!candidateRows.length) {
      doc.text("No records in the reporting period.");
    } else {
      candidateRows.forEach((row, index) => {
        const eventDate = asPeriodLabel(new Date(row.event.date), timezone);
        const eventWorkType = coerceWorkType(row.event.work);
        const ceremony = workLabel(eventWorkType);
        const result = STATUS_LABELS[eventWorkType] ?? STATUS_LABELS.OTHER;
        const notes = row.event.comments?.trim() || "None recorded";
        doc.text(`${index + 1}. ${row.candidate || "Candidate"}`);
        doc.text(`    Date: ${eventDate}`);
        doc.text(`    Ceremony: ${ceremony}`);
        doc.text(`    Lodge: ${lodgeLabel}`);
        doc.text(`    Result: ${result}`);
        doc.text(`    Notes: ${notes}`);
        doc.moveDown(0.4);
      });
    }

    doc.moveDown();
    doc.fontSize(13).text("Emergency meetings", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    if (!emergencyMeetings.length) {
      doc.text("No records in the reporting period.");
    } else {
      emergencyMeetings.forEach((meeting, index) => {
        const meetingDate = asPeriodLabel(new Date(meeting.date), timezone);
        const purpose = workLabel(meeting.work);
        const candidate = meeting.candidateName?.trim() || "None recorded";
        const notes = meeting.comments?.trim() || "None recorded";
        doc.text(`${index + 1}. ${meetingDate}`);
        doc.text(`    Purpose: ${purpose}`);
        doc.text(`    Candidate: ${candidate}`);
        doc.text(`    Notes: ${notes}`);
        doc.moveDown(0.4);
      });
    }

    doc.moveDown();
    doc.fontSize(13).text("Grand Lodge visits", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    if (!grandLodgeVisits.length) {
      doc.text("No records in the reporting period.");
    } else {
      grandLodgeVisits.forEach((visit, index) => {
        const visitDate = asPeriodLabel(new Date(visit.date), timezone);
        const officer = visit.candidateName?.trim() || visit.comments?.trim() || visit.notes?.trim() || "Officer not recorded";
        const occasion = workLabel(visit.workOfEvening);
        const notes = visit.notes?.trim() || visit.comments?.trim() || "None recorded";
        doc.text(`${index + 1}. ${visitDate}`);
        doc.text(`    Visiting officer: ${officer}`);
        doc.text(`    Occasion: ${occasion}`);
        doc.text(`    Notes: ${notes}`);
        doc.moveDown(0.4);
      });
    }

    doc.moveDown();
    doc.fontSize(13).text("Visits summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    if (!otherVisits.length) {
      doc.text("No records in the reporting period.");
    } else {
      otherVisits.forEach((visit, index) => {
        const visitDate = asPeriodLabel(new Date(visit.date), timezone);
        const lodge = lodgeDisplay(visit.lodgeName, visit.lodgeNumber) || lodgeLabel || "Not recorded";
        const eventType = workLabel(visit.workOfEvening);
        const notes = visit.notes?.trim() || visit.comments?.trim() || "None recorded";
        doc.text(`${index + 1}. ${visitDate}`);
        doc.text(`    Lodge: ${lodge}`);
        doc.text(`    Event: ${eventType}`);
        doc.text(`    Notes: ${notes}`);
        doc.moveDown(0.4);
      });
    }

    const workingRows = workings.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    doc.moveDown();
    doc.fontSize(13).text("Lodge workings summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    if (!workingRows.length) {
      doc.text("No records in the reporting period.");
    } else {
      workingRows.forEach((row, index) => {
        const date = asPeriodLabel(new Date(row.date), timezone);
        const type = workLabel(row.work);
        const purpose = row.comments?.trim() || "None recorded";
        const candidate = row.candidateName?.trim() || "None recorded";
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
        doc.text(`${index + 1}. ${date}`);
        doc.text(`    Working: ${type}`);
        doc.text(`    Purpose: ${purpose}`);
        doc.text(`    Candidate: ${candidate}`);
        doc.text(`    Result: ${tags.join(" • ")}`);
        doc.moveDown(0.4);
      });
    }

    doc.end();
    const pdfBuffer = await pdfPromise;

    const lodgeIdentifier = (user.lodgeNumber && user.lodgeNumber.trim())
      ? user.lodgeNumber.trim().replace(/\s+/g, "-")
      : (user.lodgeName || "lodge").trim().replace(/[^A-Za-z0-9]+/g, "-") || "lodge";
    const filename = `GSR_${lodgeIdentifier}_${formatForFilename(periodStart)}_${formatForFilename(periodEnd)}.pdf`;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(pdfBuffer);
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("REPORT_GSR_FAILURE", error);
    return new NextResponse(
      "Unable to generate the PDF report. Please try again or review your lodge data for missing details.",
      { status: 500 }
    );
  }
}

