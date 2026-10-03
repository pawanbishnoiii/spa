# Vercel + Supabase deployment

The app uses Supabase automatically on Vercel and keeps Cloudflare D1/R2 as a
fallback for the existing Sites deployment.

## 1. Create the database

Open Supabase Dashboard → SQL Editor, paste the complete contents of
`supabase/schema.sql`, and run it once. It creates every table, index, RLS
setting, the private `spa-media` bucket, seed content, retention cleanup and a
two-hour database heartbeat.

## 2. Generate admin and encryption secrets

Run locally (the command prints values; do not commit them):

```bash
npm run admin:secrets -- "your-admin-password"
```

## 3. Add Vercel environment variables

Add these to Production, Preview and Development as appropriate:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (recommended) or `SUPABASE_SERVICE_ROLE_KEY` (legacy)
- `ADMIN_LOGIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `ENQUIRY_ENCRYPTION_KEY`
- `ANALYTICS_SALT`
- `ADMIN_EMAILS` (optional ChatGPT-admin allowlist)

Never prefix the secret/service-role key with `NEXT_PUBLIC_`. The browser does
not access private tables directly; server routes use the server-only key and
all app tables have RLS enabled with `anon` and `authenticated` access revoked.

## 4. Deploy

Import the GitHub repository into Vercel or redeploy the existing project. The
framework preset is Next.js and `vercel.json` already uses `next build`.

The `/admin` login requires the SQL migration and all four admin/encryption
secrets. If login returns “Unable to sign in”, check the Vercel function logs
and verify that the variables are enabled for the deployment environment.

## Heartbeat note

The `pg_cron` job runs every two hours while the database is available and
updates `app_heartbeat.last_ping`. It is a health signal and cleanup job; no
in-database cron can guarantee that a hosting provider will never pause an
inactive free project.
