# My Year in the Chair — pnpm edition (upload-friendly)

This version is ready for GitHub browser uploads (no bracketed routes) and optimized for pnpm.

## Quick start
```bash
corepack enable
corepack prepare pnpm@9 --activate

pnpm i
cp .env.example .env
pnpm db:push
pnpm db:seed    # admin@example.com / password123
pnpm dev
```

Visit http://localhost:3000 and sign in with the seeded user.

## Notes
- JWT auth via HTTP-only cookie (set `JWT_SECRET` in `.env`)
- SQLite for dev; switch `DATABASE_URL` for Postgres and run `pnpm db:push`
- Matches the CI workflow you set for pnpm
