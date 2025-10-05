// scripts/ensure-db.js
// Purpose: Make build resilient. If DATABASE_URL is set, push schema; otherwise, skip gracefully.

const { execSync } = require('node:child_process');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.log("⚠️  DATABASE_URL not set — skipping `prisma db push`. Build will continue without DB migration.");
  process.exit(0);
}

try {
  console.log("🔧 DATABASE_URL detected — running `pnpm db:push`...");
  execSync('pnpm db:push', { stdio: 'inherit' });
  console.log("✅ Prisma schema pushed successfully.");
} catch (err) {
  console.error("❌ Failed to push Prisma schema:", err?.message || err);
  process.exit(1);
}