# Bowman Hub

A professional project management tool — projects, kanban task boards, timelines,
a risk register, vendors, resources, a knowledge base, and team/role management —
built on Next.js, with a Google Sheet as its database.

## Why a Google Sheet?

No database to provision: point the app at any Google Sheet (shared with a
service account) and it creates the tabs it needs. Your team can also open the
sheet directly for ad-hoc exports, backups, or pivot tables.

The browser never talks to Google directly — all Sheets/Drive access happens
server-side through a service account, and the app authenticates its own users
with hashed passwords and signed session cookies (see [Architecture](#architecture)).

## Setup

### 1. Create a Google Cloud service account

1. In the [Google Cloud Console](https://console.cloud.google.com/), create (or pick) a project.
2. Enable the **Google Sheets API** and **Google Drive API**.
3. Go to **IAM & Admin → Service Accounts → Create Service Account**.
4. Open the new service account → **Keys → Add Key → Create new key → JSON**. Save the file.

### 2. Create and share the spreadsheet

1. Create a new Google Sheet (any name).
2. Copy its ID from the URL: `https://docs.google.com/spreadsheets/d/THIS_PART/edit`.
3. Click **Share** and add the service account's `client_email` (from the JSON key) as an **Editor**.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the `client_email` from the JSON key.
- `GOOGLE_PRIVATE_KEY` — the `private_key` from the JSON key (keep the quotes and `\n` sequences).
- `GOOGLE_SHEET_ID` — the spreadsheet ID from step 2.
- `AUTH_SECRET` — a random secret for signing session cookies: `openssl rand -base64 32`.

### 4. Create the sheet tabs

```bash
npm install
npm run setup
```

This creates all required tabs (Members, Projects, Tasks, Risks, Vendors, Resources,
Labels, Roles, etc.) with headers, and seeds a default set of roles and labels.

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — since the Members tab is empty,
you'll land on **Set up** to create the first admin account. After that, sign in
normally and invite the rest of the team from **Members**.

## Architecture

- **Next.js 16 (App Router) + TypeScript**, Tailwind CSS v4, shadcn/ui.
- **Data layer** (`lib/google/sheet-repo.ts`) does targeted per-row reads/writes/deletes
  against the Sheet (not a full-tab rewrite on every save), keyed by each tab's header
  row and cached sheet/tab IDs — avoids clobbering concurrent edits.
- **Auth** (`lib/auth/`) is hand-rolled: passwords are hashed with bcrypt, sessions are
  signed JWTs (`jose`) in an httpOnly cookie, verified in `proxy.ts` (Next's renamed
  `middleware.ts`) for route protection and again per-request via `requireSession()`.
- **File attachments** upload to a Drive folder owned by the service account and are
  shared "anyone with the link can view" so teammates without Google accounts can open them.
- Entity CRUD lives in `lib/db/*.ts` (typed repositories) and `lib/actions/*.ts`
  (Server Actions used directly by forms via `useActionState`).

## Project structure

```
app/(app)/        Authenticated app shell: dashboard, projects, tasks, timeline,
                   risks, vendors, resources, members, settings, knowledge base
app/login/         Sign-in
app/setup/         First-run admin bootstrap (only reachable while Members is empty)
components/        UI components, grouped by feature
lib/db/            Typed repositories per Google Sheet tab
lib/actions/       Server Actions (create/update/delete for each entity)
lib/google/        Sheets/Drive client + generic row-level CRUD
scripts/setup-sheets.ts   One-time tab/header bootstrap (`npm run setup`)
legacy/            The original single-file HTML/Apps Script version, kept for reference
```

## Notes

- Roles and labels are workspace-editable from **Settings** (admin only) — there's
  nothing hardcoded to a particular industry or team structure.
- The dashboard, timeline, and risk counts are all computed live from real data;
  nothing is seeded or faked.
