# Vercel deployment

This repository now passes a standard `next build` and can be imported into
Vercel as a Next.js project. The public experience renders with safe default
content when Cloudflare bindings are absent.

The production site currently stores settings, encrypted enquiries and
analytics in Cloudflare D1, and uploaded media in R2. Those bindings are only
available on the current Sites/Workers deployment. On Vercel, connect a durable
SQL database and object store before using the admin dashboard or collecting
live enquiries. Do not replace these services with process memory or local
files: serverless instances are ephemeral.

Required production secrets remain server-side only:

- `ADMIN_LOGIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `ENQUIRY_ENCRYPTION_KEY`

For a full Vercel migration, map the existing D1 tables in `migrations/` to a
managed Postgres provider and map R2 operations to Vercel Blob or another
private object store. Keep the same-origin checks, encrypted enquiry fields,
secure cookies and rate limits in place.
