const { execSync } = require('node:child_process');

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set — skipping `prisma db push`. Build will continue without DB migration.');
  process.exit(0);
}

if (process.env.CI) {
  console.log('CI build detected — running prisma db push with provided env');
}

try {
  console.log('Running `prisma db push`...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('Prisma schema pushed.');
} catch (e) {
  console.error('Failed to push Prisma schema:', e?.message || e);
  process.exit(1);
}
