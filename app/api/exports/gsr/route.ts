import { NextResponse } from "next/server";
import { chromium } from "playwright-core";
import { getSession } from "@/lib/auth";
import { buildGsrReport } from "@/lib/reports/gsr";
import { renderGsrHtml } from "@/lib/reports/html/gsrTemplate";

export const dynamic = "force-dynamic";

function toDate(value: unknown) {
  const date = value instanceof Date ? value : new Date(value as string);
  return isNaN(date.getTime()) ? null : date;
}

function sanitizeFilename(value: string) {
  return value
    .trim()
    .replace(/[\s]+/g, "_")
    .replace(/[^a-zA-Z0-9_\-]/g, "")
    .slice(0, 80) || "report";
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Invalid JSON payload", { status: 400 });
  }

  const from = toDate(body?.from);
  const to = toDate(body?.to);
  if (!from || !to) {
    return new NextResponse("from and to parameters are required", { status: 400 });
  }
  if (from > to) {
    return new NextResponse("from must be before to", { status: 400 });
  }

  const lodgeId = body?.lodgeId ? String(body.lodgeId) : undefined;

  const { report, mapping } = await buildGsrReport({ from, to, lodgeId });
  const html = await renderGsrHtml(report);

  const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "25mm",
        left: "15mm",
        right: "15mm",
      },
    });
    await page.close();

    const mappingHeader = Buffer.from(JSON.stringify(mapping)).toString("base64");
    const safeNamePart = sanitizeFilename(report.lodgeNumber ?? report.lodgeName);
    const filename = `GSR_Report_${safeNamePart}_${from.toISOString().slice(0, 10)}_${to
      .toISOString()
      .slice(0, 10)}.pdf`;

    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "x-gsr-mapping": mappingHeader,
    });

    return new NextResponse(pdf, { status: 200, headers });
  } finally {
    await browser.close();
  }
}
