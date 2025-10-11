// scripts/ensure-db.js
// Purpose: Make build resilient. If DATABASE_URL is set, push schema; otherwise, skip gracefully.

const { execSync } = require('node:child_process');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.log("⚠️  DATABASE_URL not set — skipping `prisma db push`. Build will continue without DB migration.");
  process.exit(0);
}

const MAX_ATTEMPTS = 5;

const wait = (ms) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const isTransientDbError = (errorOutput = "") => {
  const normalised = errorOutput.toLowerCase();

  if (normalised.includes("p1017") || normalised.includes("server has closed the connection")) {
    return true;
  }

  if (normalised.includes("p1001") || normalised.includes("can't reach database")) {
    return true;
  }

  if (normalised.includes("timeout")) {
    return true;
  }

  return false;
};

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  try {
    if (attempt === 1) {
      console.log("🔧 DATABASE_URL detected — running `pnpm db:push`...");
    } else {
      console.log("🔁 Retrying `pnpm db:push` (attempt " + attempt + " of " + MAX_ATTEMPTS + ")...");
    }

    execSync('pnpm db:push', { stdio: 'inherit' });
    console.log("✅ Prisma schema pushed successfully.");
    process.exit(0);
  } catch (err) {
    const stdout = err && err.stdout && typeof err.stdout.toString === "function" ? err.stdout.toString() : "";
    const stderr = err && err.stderr && typeof err.stderr.toString === "function" ? err.stderr.toString() : "";
    const baseMessage = err && err.message ? err.message : String(err);
    const combined = (baseMessage + "\n" + stdout + stderr).trim();

    const shouldRetry = attempt < MAX_ATTEMPTS && isTransientDbError(combined);

    if (shouldRetry) {
      console.warn("⚠️  Transient database push failure detected:", combined);
      const delayMs = 1000 * attempt;
      console.warn(`⏳ Waiting ${delayMs}ms before retrying...`);
      wait(delayMs);
      continue;
    }

    console.error("❌ Failed to push Prisma schema:", combined);
    process.exit(1);
  }
}
