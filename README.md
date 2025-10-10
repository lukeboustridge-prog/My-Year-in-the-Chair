
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

### Deployment Note

This repository was updated with a small README change to verify the Vercel deployment pipeline.

## Google sign-in configuration

The Google authentication buttons shown on the email login and registration pages rely on three
environment variables. If they are missing, the API routes will return an error similar to
`GOOGLE_CLIENT_ID is not configured` and the UI will hide the Google option.

To enable the workflow:

1. Visit the [Google Cloud Console](https://console.cloud.google.com/) and either select an
   existing project or create a new one for this application.
2. In **APIs & Services → OAuth consent screen**, configure the consent screen (application name,
   support email, authorised domains, and test users if you are in testing mode) and publish it if
   required.
3. Navigate to **APIs & Services → Credentials**, choose **Create credentials → OAuth client ID**,
   and select **Web application**.
4. Add the following authorised redirect URIs (adjust the domain as needed):
   - `http://localhost:3000/api/auth/google/callback` for local development
   - `https://<your-production-domain>/api/auth/google/callback` for the deployed site
5. Save the client to obtain the **Client ID** and **Client secret**.
6. Provide the values to your environment:
   - `GOOGLE_CLIENT_ID` – the client ID from step 5 (server-side usage)
   - `GOOGLE_CLIENT_SECRET` – the client secret from step 5 (server-side usage)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` – the same client ID so the frontend knows Google sign-in is
     available
   Set them in `.env.local` for local development and in Vercel Project Settings → Environment
   Variables for deployments.
7. Redeploy or restart the app so the new environment variables are picked up.

Once the variables are present, users will be able to select **Sign in with Google**, and newly
registered accounts will continue to follow the approval workflow that already exists for email-based
registrations.
