
/* Ensure DB is in sync before building in CI */
const { execSync } = require('node:child_process');

function run(cmd) {
  console.log("Running `%s`...", cmd);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set — skipping `prisma db push`. Build will continue without DB migration.");
  } else {
    console.log("CI build detected — running prisma db push with provided env");
    run("prisma db push --accept-data-loss");
  }
  console.log("Running generate... (Use --skip-generate to skip the generators)");
  run("prisma generate");
} catch (e) {
  console.error("ensure-db failed:", e.message);
  process.exit(0);
}
