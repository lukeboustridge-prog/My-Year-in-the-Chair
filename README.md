# Nuclear Reset Starter (Visits + Workings only)

This is a clean, working base. No auth, no PDFs, no extras. Just the two things you need.

## 1) Set your Neon URL
Copy `.env.example` to `.env` and paste your connection string:
```
DATABASE_URL="postgresql://...neon.../my_year_in_the_chair?sslmode=require&channel_binding=require"
```

## 2) Install, push schema, run
```
pnpm install
pnpm prisma:push
pnpm dev
```
Open `/visits` and `/workings` to create records.

## 3) CI setup (GitHub)
- Add a repository secret named `DATABASE_URL` with your Neon string.
- The included workflow `.github/workflows/ci.yml` passes it to the build.

## Notes
- Prisma client singleton in `lib/db.ts`
- API routes in `app/api/visits/route.ts` and `app/api/workings/route.ts`
- Simple UI in `app/visits/page.tsx` and `app/workings/page.tsx`
