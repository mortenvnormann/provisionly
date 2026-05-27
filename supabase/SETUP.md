# Set up your Supabase database

Provisionly needs tables in **your** Supabase project. The terminal command `npm run db:push` only works after the [Supabase CLI](https://supabase.com/docs/guides/cli) is installed **and** linked — if nothing happened, use the dashboard method below (recommended).

## Option A — SQL Editor (recommended, ~2 minutes)

1. Open your project SQL Editor:  
   [https://supabase.com/dashboard/project/kluldktojkkgoldqmftt/sql/new](https://supabase.com/dashboard/project/kluldktojkkgoldqmftt/sql/new)

2. Open the file **`supabase/setup-all.sql`** in this repo (it contains every migration in order).

3. Copy **the entire file** and paste it into the SQL Editor.

4. Click **Run** (or Cmd+Enter).

5. Confirm it worked — run this in a **new** query:

   ```sql
   select count(*) as categories from public.categories;
   select count(*) as aliases from public.category_aliases;
   ```

   You should see **10** categories and **100+** aliases.

6. In the dashboard, open **Table Editor** — you should see tables like `lists`, `list_items`, `categories`, `profiles`, etc.

7. Restart your app: `npm run dev`, sign in, create a list, add `milk` / `tomatoes` — they should sort into **Dairy**, **Produce**, etc.

## Option B — Supabase CLI (optional)

```bash
# Install CLI (macOS)
brew install supabase/tap/supabase

# Log in
supabase login

# From the repo root — link to your project (ref = kluldktojkkgoldqmftt)
cd /path/to/Provisionly
supabase link --project-ref kluldktojkkgoldqmftt

# Push migrations
npm run db:push
```

Your database password is asked during `supabase link` (find it under **Project Settings → Database**).

## Troubleshooting

| Problem | Fix |
|--------|-----|
| `npm run db:push` does nothing | CLI not installed — use **Option A** |
| `relation already exists` | Tables partially created — use a fresh project or drop `public` tables first |
| All items still "General" | Run the `count(*)` queries above; if 0 rows, migrations did not run |
| Red banner in the app | Read the message — usually means empty `categories` table |

## Enable Realtime (for shared lists later)

In Supabase → **Database** → **Replication**, ensure `lists`, `list_items`, and `list_members` are enabled for Realtime (the migration adds them to the publication; toggle on if needed).
