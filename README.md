
# My Year in the Chair — Clean Install

A minimal, working Next.js 14 + Prisma + NextAuth starter tailored to your requirements:
- Login accounts and session handling
- Entities: Lodges, Memberships, Offices, Visits, LodgeWorkings, Milestones
- CRUD for Visits and Lodge Workings
- Simple dashboard with leader board for visits
- Scripted DB push on build for CI

## Quick start

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `NEXTAUTH_SECRET`.
2. `pnpm install` (or `npm install`)
3. `pnpm db:push`
4. `pnpm db:seed`
5. `pnpm dev`

## Deploy
- Works with Neon or Supabase Postgres. Set `DATABASE_URL`.
- Build runs `scripts/ensure-db.js` then `next build`.

## Notes
- No em dashes used in copy.
- Keep editing schema and app pages as needed.
