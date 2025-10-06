# My Year in the Chair — Minimal Visits & Workings (Next.js + Prisma)

This package contains a clean implementation to create/delete **Visits** and **Workings** using Next.js App Router and Prisma.

## Quick start

1. `cp .env.example .env` and set `DATABASE_URL` to your Postgres connection string.
2. Install deps: `pnpm install` (or `npm i` / `yarn`).
3. Push schema: `pnpm prisma:push` (or `npx prisma db push`).
4. Run: `pnpm dev`.
5. Open:
   - `/visits` to create Visit records
   - `/workings` to create Working records

The build script auto-runs `prisma db push` *if* `DATABASE_URL` is set.

## Notes

- APIs:
  - `POST /api/visits` with `{ lodgeName, lodgeNo, date, notes? }`
  - `DELETE /api/visits?id=...`
  - `POST /api/workings` with `{ lodgeName, lodgeNo, workingType, date, notes? }`
  - `DELETE /api/workings?id=...`
- Client helpers exported from `lib/api.ts`
- Prisma client singleton in `lib/db.ts`
