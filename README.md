
# Postgres + Dynamic Pages Fix

This patch updates your Prisma datasource to PostgreSQL for Vercel/Neon deployment
and adds `export const dynamic = "force-dynamic";` stubs to DB-backed pages.

### How to apply
1. Replace `/prisma/schema.prisma` with the one in this archive.
2. Add `export const dynamic = "force-dynamic";` to the top of:
   - app/dashboard/page.tsx
   - app/leaderboard/page.tsx
   - app/visits/page.tsx
   - app/resources/page.tsx
3. In Vercel build settings, use:
   ```bash
   pnpm db:push && pnpm build
   ```
4. Redeploy — Prisma will now connect to your Neon PostgreSQL database.
