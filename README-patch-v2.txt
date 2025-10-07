Patch v2 — Next.js build fix (dynamic imports for PDF) — 2025-10-05 19:15:49

WHAT CHANGED.
- Rewrote src/utils/pdfReport.ts to use **dynamic imports** so Next.js won't attempt to bundle `jspdf` and `jspdf-autotable` on the server.
- Marked Reports page as a **client component** and updated buttons to await async export functions.

REQUIRED INSTALL (CI/build step)
    pnpm add jspdf jspdf-autotable

FILES
1) src/utils/pdfReport.ts          (REPLACE)
2) src/pages/Reports.tsx           (REPLACE)

NOTES
- The PDF helpers are now **async**. Update any calls accordingly (already handled in the provided Reports.tsx).
- If you SSR this page, ensure it's client-only. The provided page has `'use client'` at the top.
