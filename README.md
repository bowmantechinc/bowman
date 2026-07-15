# Bowman Hub

A professional project management tool — projects, kanban task boards, timelines,
a risk register, vendors, resources, a knowledge base, and team/role management —
built on Next.js, with Postgres (Supabase) as its database and Cloudflare R2
for file attachments.

The browser never talks to Postgres or R2 directly — all database and
file-storage access happens server-side, and the app authenticates its own users
with hashed passwords and signed session cookies (see [Architecture](#architecture)).

## Setup

### 1. Create a Postgres database

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine) or use any other Postgres host.
2. If using Supabase: **Settings → Database → Connection string**, and copy the **pooled**
   connection string (port `6543`, includes `pgbouncer=true`) — this is the one
   that works well from serverless environments like Vercel.

### 2. Create a Cloudflare R2 bucket (for file attachments)

1. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **R2 Object Storage**
   and create a bucket (free tier: 10GB storage).
2. Open the bucket → **Settings** → enable **Public Development URL** (or connect a
   custom domain) — copy that base URL.
3. Go to **R2 → Manage API tokens → Create API token**, grant **Object Read & Write**
   scoped to the bucket, and copy the Access Key ID + Secret Access Key.
4. Your Account ID is shown on the main R2 overview page.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

- `POSTGRES_URL` — the pooled connection string from step 1.
- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL`
  — from step 2, used for project file attachments.
- `AUTH_SECRET` — a random secret for signing session cookies: `openssl rand -base64 32`.
- `RESEND_API_KEY` — needed to send member invitation and task notification emails.
  Sign up free at [resend.com](https://resend.com), create an API key, and paste it in.
  Without a verified sending domain, Resend still delivers from `onboarding@resend.dev`
  to any recipient — fine for getting started. `RESEND_FROM_EMAIL` and
  `NEXT_PUBLIC_APP_URL` are optional overrides (see comments in `.env.local.example`).
- `VAPID_PUBLIC_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`
  — needed for desktop push notifications. Generate a keypair with
  `npx web-push generate-vapid-keys`; set both public key vars to the same value
  (it isn't secret), and `VAPID_SUBJECT` to a `mailto:` contact address.

### 4. Create the database tables and check storage

```bash
npm install
npm run setup
```

This creates all required tables (Members, Projects, Tasks, Risks, Vendors, Resources,
Labels, Roles, etc.) if they don't already exist, seeds a default set of roles and
labels, and confirms the R2 bucket is reachable.

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — since the Members table is empty,
you'll land on **Set up** to create the first admin account. After that, sign in
normally and invite the rest of the team by email from **Members** — pick their role
and (optionally) a project to add them to as soon as they accept.

## Architecture

- **Next.js 16 (App Router) + TypeScript**, Tailwind CSS v4, shadcn/ui.
- **Data layer** (`lib/db/pg-repo.ts`) is a small generic CRUD layer over `postgres.js`,
  with a short-lived read cache (invalidated on writes) so a page reading the same
  table multiple times doesn't round-trip to the database each time.
- **Auth** (`lib/auth/`) is hand-rolled: passwords are hashed with bcrypt, sessions are
  signed JWTs (`jose`) in an httpOnly cookie, verified in `proxy.ts` (Next's renamed
  `middleware.ts`) for route protection and again per-request via `requireSession()`.
- **Invitations** (`lib/actions/invites.ts`) send email via Resend with a link to
  `/accept-invite/[id]`, where the invitee sets their name/password and — if a project
  was picked — is added to it automatically on acceptance.
- **Notifications** (`lib/notify.ts`) fan out to every other member of a project when a
  task is assigned, commented on, or its status changes: an in-app bell (top-right header),
  a desktop push notification (Web Push + a service worker at `public/sw.js`), and an email
  via Resend. Push subscriptions and notification history live in the `PushSubscriptions`
  and `Notifications` tables.
- **File attachments** (`lib/r2/storage.ts`) upload to a Cloudflare R2 bucket via the
  S3-compatible API, server-side only — the API credentials never reach the browser.
- Entity CRUD lives in `lib/db/*.ts` (typed repositories) and `lib/actions/*.ts`
  (Server Actions used directly by forms via `useActionState`).

## Project structure

```
app/(app)/           Authenticated app shell: dashboard, projects, tasks, timeline,
                      risks, vendors, resources, members, settings, knowledge base
app/login/            Sign-in
app/setup/            First-run admin bootstrap (only reachable while Members is empty)
app/accept-invite/    Public invite-acceptance flow
components/           UI components, grouped by feature
lib/db/               Typed repositories per table + the Postgres client/CRUD layer
lib/actions/          Server Actions (create/update/delete for each entity)
lib/r2/                Storage client (project file attachments)
lib/email.ts           Resend client for invitation and notification emails
scripts/setup-db.ts    One-time table bootstrap + storage bucket check (`npm run setup`)
legacy/                The original single-file HTML/Apps Script version, kept for reference
```

## Notes

- Roles and labels are workspace-editable from **Settings** (admin only) — there's
  nothing hardcoded to a particular industry or team structure.
- The dashboard, timeline, and risk counts are all computed live from real data;
  nothing is seeded or faked.
