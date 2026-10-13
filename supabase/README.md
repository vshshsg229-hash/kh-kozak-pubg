# KH么Kozak Battle Hub — Supabase backend

This is the primary server option for Battle Hub. Supabase provides PostgreSQL + Auth; an Edge Function handles account endpoints, atomic online game rewards and the shared leaderboard. Refresh tokens are rotated through the function so signed-in sessions can renew. The GitHub Pages frontend stays where it is.

## 1. Create the Supabase project
1. Open https://supabase.com/dashboard and create a project.
2. Save the database password privately.
3. In **Project Settings → API**, copy the Project URL and the **publishable/anon** key. Never put the service-role/secret key in frontend code.

## 2. Create the database tables
Open **SQL Editor → New query**, paste the full contents of `supabase/schema.sql`, then click **Run**. This creates profiles, game-event deduplication and the profile trigger. Keep RLS enabled; the public client has no direct write permissions.

## 3. Deploy the Edge Function
Install Supabase CLI and log in:
```sh
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy hub-api --no-verify-jwt
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_SECRET FRONTEND_ORIGIN=https://vshshsg229-hash.github.io
```
Use the secret/service-role key only as a Supabase Function secret. Do not paste it into this repository, website, or chat. You can find the project ref in the project URL. The function can also be deployed from a local Supabase CLI workspace.

The health check is:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/hub-api/api/health`
Expected JSON: `{"ok":true,"database":"connected",...}`.

## 4. Connect the website
Open the website → **Мій профіль → Онлайн-сервер**.
- Server URL: `https://YOUR_PROJECT_REF.supabase.co`
- Supabase publishable/anon key: the public key from Project Settings → API.
Press **ПІДКЛЮЧИТИ СЕРВЕР**, then register or log in. The public key is intended for browser use; the service-role key is not.

If Supabase email confirmation is enabled, register first, confirm the email, then log in. To test immediate sign-in during setup, configure email confirmation deliberately in Supabase Auth settings; do not disable it permanently without considering account security.

## Included server-backed features
- Supabase Auth accounts and password handling (Supabase manages password hashes).
- PostgreSQL user profiles and shared coins/points/XP/game counts.
- Shared leaderboard.
- Server-defined game rewards in a single PostgreSQL transaction, duplicate event IDs, and a daily reward limit.
- Server health check and restricted CORS origin.

The daily shop, cosmetic inventory, secret-code redemption and some achievements remain browser-local for now; this release does not claim those are synced online. Game outcomes are still initiated by the browser, so this is a practical server-backed reward system for the current minigames, not a tamper-proof competitive anti-cheat system.

## Legacy option
The `backend/` Node server and `render.yaml` remain as an alternative deployment path. For Supabase-only hosting, deploy the `hub-api` Edge Function described above; no Render service is required.
