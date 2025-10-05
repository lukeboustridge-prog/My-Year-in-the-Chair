import { Router } from "express";
import PDFDocument from "pdfkit";

const router = Router();

router.post("/pdf", async (req, res) => {
  const { profile, visits, offices, title = "My Year in the Chair – Report" } = req.body || {};
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=My-Year-in-the-Chair.pdf");

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(res);

  doc.fontSize(16).text(title);
  const line = [profile?.prefix, profile?.fullName, profile?.postNominals].filter(Boolean).join(" ");
  doc.moveDown(0.5).fontSize(11).text(line);
  doc.text(`Generated: ${new Date().toLocaleString()}`);

  doc.moveDown().fontSize(12).text("Visits", { underline: true });
  doc.moveDown(0.5).fontSize(10);
  (visits || []).forEach((v: any, i: number) => {
    doc.text(`${i + 1}. ${v.dateISO} — ${v.lodgeName} — ${v.eventType}${v.role ? " — " + v.role : ""}`);
    if (v.notes) doc.text(`    Notes: ${v.notes}`);
  });

  doc.moveDown().fontSize(12).text("Offices", { underline: true });
  doc.moveDown(0.5).fontSize(10);
  (offices || []).forEach((o: any, i: number) => {
    doc.text(`${i + 1}. ${o.lodgeName} — ${o.office} (${o.startDateISO} – ${o.endDateISO || "Current"}) ${o.isGrandLodge ? "[Grand Lodge]" : ""}`);
  });

  doc.end();
});

export default router;