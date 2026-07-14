# Bowman Hub

A professional project management tool — projects, kanban task boards, timelines,
a risk register, vendors, resources, a knowledge base, and team/role management —
built on Next.js, with Supabase (Postgres + Storage) as its backend.

The browser never talks to Supabase directly — all database and file-storage
access happens server-side, and the app authenticates its own users with hashed
passwords and signed session cookies (see [Architecture](#architecture)).

## Setup

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. Go to **Settings → Database → Connection string**, and copy the **pooled**
   connection string (port `6543`, includes `pgbouncer=true`) — this is the one
   that works well from serverless environments like Vercel.
3. Go to **Settings → API** and copy the **Project URL** and the **`service_role`**
   secret key (not the anon/public key).

Any other Postgres works too for the database — just set `POSTGRES_URL` to its
connection string — but file attachments specifically need Supabase Storage.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

- `POSTGRES_URL` — the pooled connection string from step 1.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from step 1, used for project file attachments.
- `AUTH_SECRET` — a random secret for signing session cookies: `openssl rand -base64 32`.
- `RESEND_API_KEY` — needed to send member invitation emails. Sign up free at
  [resend.com](https://resend.com), create an API key, and paste it in. Without a
  verified sending domain, Resend still delivers from `onboarding@resend.dev` to any
  recipient — fine for getting started. `RESEND_FROM_EMAIL` and `NEXT_PUBLIC_APP_URL`
  are optional overrides (see comments in `.env.local.example`).

### 3. Create the database tables and storage bucket

```bash
npm install
npm run setup
```

This creates all required tables (Members, Projects, Tasks, Risks, Vendors, Resources,
Labels, Roles, etc.) if they don't already exist, seeds a default set of roles and
labels, and creates the public `attachments` Storage bucket.

### 4. Run it

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
- **File attachments** (`lib/supabase/storage.ts`) upload to a public Supabase Storage
  bucket, server-side only, via the `service_role` key — the upload/delete API routes
  never expose that key to the browser.
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
lib/supabase/         Storage client (project file attachments)
lib/email.ts           Resend client for invitation emails
scripts/setup-db.ts    One-time table + storage bucket bootstrap (`npm run setup`)
legacy/                The original single-file HTML/Apps Script version, kept for reference
```

## Notes

- Roles and labels are workspace-editable from **Settings** (admin only) — there's
  nothing hardcoded to a particular industry or team structure.
- The dashboard, timeline, and risk counts are all computed live from real data;
  nothing is seeded or faked.
