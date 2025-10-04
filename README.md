# My Year in the Chair (GitHub upload friendly)

This version avoids dynamic bracket folders and uses simple JWT auth, so you can upload files directly via GitHub's web UI.

## Stack
- Next.js 14 (App Router)
- Prisma + SQLite
- Tailwind CSS
- Custom JWT auth (no NextAuth, no bracketed folders)

## Quick start
```bash
npm i
cp .env.example .env
npm run db:push
npm run db:seed   # admin@example.com / password123
npm run dev
```

Visit http://localhost:3000 and sign in with the seeded user.
