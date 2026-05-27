# Provisionly

Minimal, collaborative grocery lists — mobile-first PWA built with Next.js, Supabase, and Vercel.

## Stack

- **Next.js** (App Router)
- **Supabase** (Postgres, Auth, Realtime)
- **Vercel** (hosting)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, for local dev).
3. Copy `.env.example` to `.env.local` and add your project URL and publishable key.

**Apply schema to your remote project** — required before lists/auth work fully.

→ **Easiest:** follow **[supabase/SETUP.md](./supabase/SETUP.md)** — paste `supabase/setup-all.sql` into the Supabase SQL Editor and click Run.

CLI (optional, after `brew install supabase/tap/supabase` and `supabase link`):

```bash
npm run db:push
```

**Local Supabase** (optional):

```bash
npx supabase start
npx supabase db reset
```

### 3. Auth redirect URLs

In Supabase → **Authentication** → **URL configuration**:

- **Site URL:** `http://localhost:3000` (and your Vercel URL in production)
- **Redirect URLs:** `http://localhost:3000/auth/callback`, `https://your-app.vercel.app/auth/callback`

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you’ll land on the login screen.

## Launch

Before going to production, follow **[docs/LAUNCH_CHECKLIST.md](./docs/LAUNCH_CHECKLIST.md)** (security review, Supabase/Vercel config, smoke tests).

Quick local gate:

```bash
npm run prelaunch
```

## Deploy on Vercel

1. Import the GitHub repo; **Root Directory** should be `.` (repo root — `package.json` lives here).
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and **`SUPABASE_SERVICE_ROLE_KEY`** (server only — not `NEXT_PUBLIC_`).
3. Deploy.

## Database schema (v1)

| Table | Purpose |
|-------|---------|
| `profiles` | User settings (locale, theme) |
| `categories` | Fixed grocery sections (multilingual labels) |
| `category_aliases` | Dictionary for auto-categorisation |
| `lists` / `list_items` / `list_members` | Collaborative shopping lists |
| `share_links` | List links (7-day expiry) & recipe links (no expiry) |
| `recipes` / `recipe_ingredients` | Recipes with scalable servings |
| `recipe_access` | View-only access from shared recipes |
| `recipe_clones` | Clone audit trail |

Row Level Security is enabled on all tables. Realtime is enabled for `lists`, `list_items`, and `list_members`.

## Environment & security

| Variable | Safe in browser? | Where to set |
|----------|------------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `.env.local`, Vercel |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes (with RLS) | `.env.local`, Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | **Never** | `.env.local`, Vercel (server only) |

- **`.env.local`** is gitignored — put real keys only there (or in Vercel for production).
- **`SUPABASE_SERVICE_ROLE_KEY`** is required for saving lists on newer Supabase projects. Newer projects sign user JWTs with ES256; PostgREST may not verify them, so `auth.uid()` is null in RLS even when you are logged in. The app verifies your identity via Auth, then writes using the service role with strict ownership checks in code.
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or commit it.
- If a key was shared in chat, email, or a screenshot: **regenerate it** in [Supabase → Project Settings → API](https://supabase.com/dashboard/project/_/settings/api), update `.env.local` and Vercel, then redeploy.
- Before committing: `npm run check:secrets` scans tracked files for accidental key leaks.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run check:secrets` | Fail if secrets appear in git-tracked files |
| `npm run prelaunch` | Secrets check + lint + production build (run before deploy) |
