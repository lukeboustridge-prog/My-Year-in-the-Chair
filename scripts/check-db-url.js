/**
 * Fail early if DATABASE_URL is missing or not a postgres URL.
 */
function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

const url = process.env.DATABASE_URL || "";
if (!url) fail("DATABASE_URL is not set in the environment.");

const u = url.trim();
if (u.startsWith("psql ")) {
  fail("DATABASE_URL looks like a psql command. Paste only the URL (no `psql` / quotes).");
}
const lower = u.toLowerCase();
if (!(lower.startsWith("postgresql://") || lower.startsWith("postgres://"))) {
  fail("DATABASE_URL must start with 'postgresql://' or 'postgres://'. Got: " + u.split("?")[0]);
}

console.log("✅ DATABASE_URL looks valid.");
process.exit(0);
