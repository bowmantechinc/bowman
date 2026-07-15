# Bowman Hub

A professional project management tool — projects, kanban task boards, timelines,
a risk register, vendors, resources, a knowledge base, and team/role management —
built on Next.js and deployed as a Cloudflare Worker, with D1 (SQLite) as its
database and R2 for file attachments.

The browser never talks to D1 or R2 directly — all database and file-storage
access happens server-side via Cloudflare bindings, and the app authenticates
its own users with hashed passwords and signed session cookies (see
[Architecture](#architecture)).

## Setup

Cloudflare's tooling (`wrangler`, `@opennextjs/cloudflare`) requires **Node 22+**.
If your default Node is older, install Node 22 separately and prefix the
commands below with its path, e.g. `PATH="/path/to/node22/bin:$PATH"`.

### 1. Create a Cloudflare account and the D1 database

```bash
npm install
npx wrangler login   # or set CLOUDFLARE_API_TOKEN
npx wrangler d1 create bowman_app_db
```

Paste the resulting `database_id` into `wrangler.jsonc`'s `d1_databases` entry
(the `database_name` should already match).

### 2. Create an R2 bucket (for file attachments)

1. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **R2 Object Storage**
   and create a bucket (free tier: 10GB storage).
2. Open the bucket → **Settings** → enable **Public Development URL** (or connect a
   custom domain) — copy that base URL into `R2_PUBLIC_URL` (below) and into
   `wrangler.jsonc`'s `vars`.
3. Update `wrangler.jsonc`'s `r2_buckets` entry's `bucket_name` to match.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

- `R2_PUBLIC_URL` — from step 2.
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

For local dev, non-secret vars (`R2_PUBLIC_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`) also need to be in `wrangler.jsonc`'s `vars`
so `wrangler dev`/`next dev` can see them. Secrets are never committed there —
push them with `wrangler secret put <NAME>` once you're ready to deploy.

### 4. Create the database tables

```bash
npm run db:migrate:local    # local D1 simulator, for `next dev` / `wrangler dev`
npm run db:migrate:remote   # the real, deployed D1 database
```

This runs `migrations/0001_init.sql`, creating all required tables (Members,
Projects, Tasks, Risks, Vendors, Resources, Labels, Roles, etc.) and seeding a
default set of roles and labels.

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — since the Members table is empty,
you'll land on **Set up** to create the first admin account. After that, sign in
normally and invite the rest of the team by email from **Members** — pick their role
and (optionally) a project to add them to as soon as they accept.

### 6. Deploy

```bash
npm run deploy
```

Builds via `@opennextjs/cloudflare` and deploys with `wrangler`. Prints the live
`*.workers.dev` URL.

## Architecture

- **Next.js 16 (App Router) + TypeScript**, Tailwind CSS v4, shadcn/ui, deployed
  to Cloudflare Workers via `@opennextjs/cloudflare` (`open-next.config.ts`,
  `wrangler.jsonc`).
- **Data layer** (`lib/db/d1-repo.ts`) is a small generic CRUD layer over the D1
  binding (`lib/db/d1-client.ts`, resolved per-request via `getCloudflareContext()`),
  with a short-lived read cache (invalidated on writes) so a page reading the same
  table multiple times doesn't round-trip to the database each time.
- **Auth** (`lib/auth/`) is hand-rolled: passwords are hashed with bcrypt, sessions
  are signed JWTs (`jose`) in an httpOnly cookie, verified per-request via
  `requireSession()`/`requireAdmin()` in every protected layout/page (there's no
  separate middleware layer — Next.js 16's `proxy.ts` defaults to the Node.js
  runtime, which Cloudflare's adapter doesn't yet support, and since Workers runs
  everything in one runtime anyway there's no performance reason to keep one).
- **Invitations** (`lib/actions/invites.ts`) send email via Resend with a link to
  `/accept-invite/[id]`, where the invitee sets their name/password and — if a project
  was picked — is added to it automatically on acceptance.
- **Notifications** (`lib/notify.ts`) fan out to every other member of a project when a
  task is assigned, commented on, or its status changes: an in-app bell (top-right header),
  a desktop push notification (Web Push + a service worker at `public/sw.js`), and an email
  via Resend. Push subscriptions and notification history live in the `PushSubscriptions`
  and `Notifications` tables.
- **File attachments** (`lib/r2/storage.ts`) upload to an R2 bucket via the native
  binding (`env.ATTACHMENTS_BUCKET`), server-side only.
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
lib/db/               Typed repositories per table + the D1 client/CRUD layer
lib/actions/          Server Actions (create/update/delete for each entity)
lib/r2/                Storage client (project file attachments)
lib/email.ts           Resend client for invitation and notification emails
migrations/            D1 schema migrations (`npm run db:migrate:local` / `:remote`)
wrangler.jsonc          Cloudflare Worker config: D1/R2 bindings, vars
open-next.config.ts     OpenNext Cloudflare adapter config
legacy/                The original single-file HTML/Apps Script version, kept for reference
```

## Notes

- Roles and labels are workspace-editable from **Settings** (admin only) — there's
  nothing hardcoded to a particular industry or team structure.
- The dashboard, timeline, and risk counts are all computed live from real data;
  nothing is seeded or faked.
