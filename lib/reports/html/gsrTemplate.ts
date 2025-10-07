import { promises as fs } from "fs";
import path from "path";
import { candidateNarrative, type ReportModel } from "../gsr";

let logoDataUrl: string | null | undefined;

async function loadLogoDataUrl() {
  if (logoDataUrl !== undefined) return logoDataUrl;
  const candidates = ["logo.png", "logo.svg"];
  for (const file of candidates) {
    const filePath = path.join(process.cwd(), "public", file);
    try {
      const data = await fs.readFile(filePath);
      if (file.endsWith(".png")) {
        logoDataUrl = `data:image/png;base64,${data.toString("base64")}`;
      } else if (file.endsWith(".svg")) {
        const svgText = data.toString("utf8");
        const encoded = Buffer.from(svgText).toString("base64");
        logoDataUrl = `data:image/svg+xml;base64,${encoded}`;
      }
      if (logoDataUrl) return logoDataUrl;
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        console.warn("Failed to load logo for GSR template", error);
      }
    }
  }
  logoDataUrl = null;
  return logoDataUrl;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

function formatRange(from: Date, to: Date) {
  return `${formatDate(from)} – ${formatDate(to)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSummary(report: ReportModel) {
  const s = report.summary;
  return `
    <table class="summary">
      <tbody>
        <tr><th>Total candidates</th><td>${s.totalCandidates}</td></tr>
        <tr><th>Initiations</th><td>${s.initiations}</td></tr>
        <tr><th>Passings</th><td>${s.passings}</td></tr>
        <tr><th>Raisings</th><td>${s.raisings}</td></tr>
        <tr><th>Affiliations</th><td>${s.affiliations}</td></tr>
        <tr><th>Awaiting Passing</th><td>${s.awaitingPassing}</td></tr>
        <tr><th>Awaiting Raising</th><td>${s.awaitingRaising}</td></tr>
      </tbody>
    </table>
  `;
}

function renderCandidateTable(report: ReportModel, candidateIndex: number) {
  const block = report.candidates[candidateIndex];
  const rows = block.timeline
    .map((event) => {
      const notes = event.notes ? escapeHtml(event.notes) : "";
      const result = event.result ? escapeHtml(event.result) : "";
      return `<tr>
        <td>${formatDate(event.date)}</td>
        <td>${escapeHtml(String(event.ceremony ?? ""))}</td>
        <td>${escapeHtml(event.lodgeName)}</td>
        <td>${result}</td>
        <td>${notes}</td>
      </tr>`;
    })
    .join("");

  return `
    <table class="candidate-timeline">
      <thead>
        <tr>
          <th>Date</th>
          <th>Ceremony</th>
          <th>Lodge</th>
          <th>Result</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5" class="muted">No ceremonies recorded</td></tr>'}
      </tbody>
    </table>
  `;
}

function renderCandidates(report: ReportModel) {
  if (report.candidates.length === 0) {
    return `<p class="muted">No candidate progress was recorded for this period.</p>`;
  }
  return report.candidates
    .map((block, index) => {
      const membership = block.membershipNumber ? `<div class="membership">Membership No. ${escapeHtml(block.membershipNumber)}</div>` : "";
      return `<section class="candidate">
        <h3>${escapeHtml(block.name)}</h3>
        ${membership}
        <p>${escapeHtml(candidateNarrative(block))}</p>
        ${renderCandidateTable(report, index)}
      </section>`;
    })
    .join("<div class=\"page-break\"></div>");
}

function renderAppendix(report: ReportModel) {
  const rows = report.appendix.rows
    .map((row) => {
      const notes = row.notes ? escapeHtml(row.notes) : "";
      const result = row.result ? escapeHtml(row.result) : "";
      return `<tr>
        <td>${formatDate(row.date)}</td>
        <td>${escapeHtml(row.lodge)}</td>
        <td>${escapeHtml(String(row.ceremony ?? ""))}</td>
        <td>${escapeHtml(row.candidates)}</td>
        <td>${result}</td>
        <td>${notes}</td>
      </tr>`;
    })
    .join("");

  return `<section class="appendix">
    <h2>Appendix A. Working Register</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Lodge</th>
          <th>Ceremony</th>
          <th>Candidates</th>
          <th>Result</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="6" class="muted">No workings recorded</td></tr>'}
      </tbody>
    </table>
  </section>`;
}

export async function renderGsrHtml(report: ReportModel): Promise<string> {
  const logo = await loadLogoDataUrl();
  const preparedBy = report.wmPostNominals
    ? `${escapeHtml(report.wmName)} ${escapeHtml(report.wmPostNominals)}`
    : escapeHtml(report.wmName);
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charSet="utf-8" />
    <title>Grand Superintendent Report</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        margin: 0;
        padding: 30px 40px 60px;
        color: #222;
        font-size: 14px;
        line-height: 1.5;
      }
      header.cover {
        text-align: center;
        padding-top: 40px;
        page-break-after: always;
      }
      header.cover h1 {
        font-size: 32px;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      header.cover .sub {
        font-size: 18px;
        margin-bottom: 8px;
      }
      header.cover .range {
        font-size: 16px;
        margin-bottom: 20px;
      }
      header.cover .meta {
        font-size: 14px;
        margin: 8px 0;
      }
      header.cover img.logo {
        width: 120px;
        height: auto;
        margin-bottom: 30px;
      }
      h2 {
        font-size: 20px;
        margin-top: 40px;
        margin-bottom: 10px;
      }
      h3 {
        font-size: 18px;
        margin-bottom: 5px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 18px;
      }
      table th, table td {
        border: 1px solid #ccc;
        padding: 6px 8px;
        text-align: left;
      }
      table th {
        background: #f5f5f5;
        font-weight: 600;
      }
      table.summary {
        width: auto;
        margin-bottom: 20px;
      }
      table.summary th {
        width: 200px;
      }
      .candidate {
        page-break-inside: avoid;
        margin-bottom: 40px;
      }
      .candidate .membership {
        color: #666;
        margin-bottom: 6px;
      }
      .candidate-timeline td, .candidate-timeline th {
        font-size: 13px;
      }
      .appendix table td, .appendix table th {
        font-size: 12px;
      }
      .muted {
        color: #666;
        text-align: center;
      }
      .page-break {
        page-break-after: always;
      }
      footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        font-size: 12px;
        color: #555;
        padding: 8px 40px;
        display: flex;
        justify-content: space-between;
      }
      footer .page-number::before {
        content: "Page " counter(page) " of " counter(pages);
      }
      footer .lodge::before {
        content: "${escapeHtml(report.lodgeName)}";
      }
    </style>
  </head>
  <body>
    <header class="cover">
      ${logo ? `<img src="${logo}" alt="Lodge logo" class="logo" />` : ""}
      <h1>Grand Superintendent of Region Report</h1>
      <div class="sub">${escapeHtml(report.lodgeName)}${
        report.lodgeNumber ? ` No. ${escapeHtml(report.lodgeNumber)}` : ""
      }</div>
      <div class="range">${formatRange(report.from, report.to)}</div>
      <div class="meta">Prepared for the Grand Superintendent of Region</div>
      <div class="meta">Prepared by ${preparedBy}</div>
    </header>
    <main>
      <section>
        <h2>Executive Summary</h2>
        ${renderSummary(report)}
      </section>
      <section>
        <h2>Candidate Progress</h2>
        ${renderCandidates(report)}
      </section>
      ${renderAppendix(report)}
    </main>
    <footer>
      <span class="lodge"></span>
      <span class="page-number"></span>
    </footer>
  </body>
</html>`;
}
