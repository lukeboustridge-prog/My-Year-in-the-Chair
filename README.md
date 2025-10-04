# My Year in the Chair

A compact full‑stack starter to help a Master track visits, earn points, and climb a visitor leaderboard.

## Stack
- Next.js 14 (App Router)
- Prisma + SQLite (switchable to Postgres)
- NextAuth v5 (credentials demo)
- Tailwind CSS

## Quick start
```bash
# 1) Install deps
npm i   # or pnpm i / yarn

# 2) Create .env from example
cp .env.example .env
# (Optionally set a strong NEXTAUTH_SECRET)

# 3) Generate Prisma client and create DB
npm run db:push

# 4) Seed demo data (creates admin@example.com / password123)
npm run db:seed

# 5) Run dev server
npm run dev
```

Open http://localhost:3000 and sign in via **admin@example.com / password123**.

## Production notes
- Switch to Postgres by setting `DATABASE_URL` to your Postgres URI then `npm run db:push`.
- Replace credentials auth with your provider of choice.
- Add rate limits and input validation on API routes for hardened prod.
