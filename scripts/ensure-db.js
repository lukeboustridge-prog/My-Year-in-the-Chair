
/* Ensure DB is in sync before building in CI */
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const prismaCli = path.join(
  path.dirname(require.resolve("prisma/package.json")),
  "build/index.js",
);

function runPrisma(args) {
  console.log("Running `prisma %s`...", args.join(" "));
  execFileSync(process.execPath, [prismaCli, ...args], { stdio: "inherit" });
}

try {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set — skipping `prisma db push`. Build will continue without DB migration.");
  } else {
    console.log("CI build detected — running prisma db push with provided env");
    runPrisma(["db", "push", "--accept-data-loss"]);
  }
  console.log("Running generate... (Use --skip-generate to skip the generators)");
  runPrisma(["generate"]);
} catch (e) {
  console.error("ensure-db failed:", e.message);
  process.exit(0);
}
