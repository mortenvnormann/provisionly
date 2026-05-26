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
3. Copy `.env.example` to `.env.local` and add your project URL and anon key.

**Apply schema to your remote project** (Supabase Dashboard → SQL Editor, or CLI):

```bash
# Link your project (one-time)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push
```

Or run each file in `supabase/migrations/` in order in the SQL Editor.

**Local Supabase** (optional):

```bash
npx supabase start
npx supabase db reset
```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Import the GitHub repo; **Root Directory** should be `.` (repo root — `package.json` lives here).
2. Add environment variables from `.env.example`.
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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
