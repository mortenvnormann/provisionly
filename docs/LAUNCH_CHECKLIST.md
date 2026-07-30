# Provisionly — Pre-launch checklist

Use this before pointing a production domain at the app. Work top to bottom; do not skip the **Security** section.

---

## 1. Automated checks (local)

Run from the repo root:

```bash
npm run prelaunch
```

This runs `check:secrets`, `check:colors`, `lint`, and `build`. All must pass.

| Check | What it verifies |
|-------|------------------|
| `npm run check:secrets` | No Supabase keys committed to git |
| `npm run check:colors` | No hardcoded hex colors in UI source |
| `npm run check:realtime` | Supabase Realtime websocket connects |
| `npm run verify:security` | Linked DB has security migration applied |
| `npm run lint` | ESLint passes |
| `npm run build` | TypeScript + production build succeeds |

---

## 2. Supabase — database

Apply every migration to your **production** Supabase project. Easiest: paste new sections from `supabase/setup-all.sql` into the SQL Editor, or:

```bash
npm run db:push
```

Confirm these migrations exist:

| Migration | Purpose |
|-----------|---------|
| Initial schema + RLS + categories | Core tables |
| `20260526100300_account_deletion.sql` | `delete_own_account()` |
| `20260527100000_recipe_description.sql` | Recipe notes field |
| `20260528100000_list_grouping_and_profile_names.sql` | List grouping + profile names |
| `20260602100000_security_hardening.sql` | Owner-only member insert + RPC confirmation |
| `20260622100000_recipe_realtime.sql` | Realtime for shared recipes |

Quick sanity query:

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'lists' and column_name = 'group_by_category';

select proname, pg_get_function_arguments(oid) as args
from pg_proc where proname = 'delete_own_account';
```

Enable Realtime in **Database → Replication** for: `lists`, `list_items`, `list_members`, `recipes`, `recipe_ingredients`.

Verify: `npm run check:realtime`

---

## 3. Supabase — Auth & dashboard security

In [Supabase Dashboard → Authentication](https://supabase.com/dashboard):

- [ ] **Site URL** = your production URL (e.g. `https://provisionly.vercel.app`)
- [ ] **Redirect URLs** include `https://your-domain/auth/callback`
- [ ] **Email confirmations** — consider enabling for production (`enable_confirmations = true`) so sign-ups require verified email
- [ ] **Leaked password protection** — enable if available on your plan
- [ ] **Rate limiting** — review Auth rate limits for sign-in/sign-up

In **Project Settings → API**:

- [ ] **Rotate keys** if a service role or secret key was ever pasted in chat, screenshots, or committed files
- [ ] Confirm **RLS is enabled** on all public tables (Table Editor → each table)

---

## 4. Vercel — environment variables

Set in **Project → Settings → Environment Variables** (Production):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Publishable/anon key only |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Server only** — never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_APP_URL` | Recommended | Production origin for share links (no trailing slash) |

**Critical:** `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. The app only uses it on the server after `getVerifiedUser()` and explicit access checks in code. Never expose it to the browser.

After changing env vars, **redeploy**.

---

## 5. Security architecture (review)

These are the main risks and how the app mitigates them.

### Service role writes

**Risk:** Service role can read/write all data if application code skips authorization.

**Mitigation:** Every server action calls `getVerifiedUser()` first. List/recipe/share helpers call `assertListAccess`, `assertRecipeViewAccess`, or ownership checks before writing.

**Launch action:** When adding new server actions, always verify the user and resource access before `createServiceClient()`.

### Share links

**Risk:** Guessable tokens could grant access to lists/recipes.

**Mitigation:** Tokens are 32 random bytes (base64url). Only SHA-256 hashes are stored. List and recipe links expire after 72 hours.

**Launch action:** Do not log full share URLs server-side.

### Open redirects

**Risk:** Auth callback could redirect users to external sites.

**Mitigation:** `safeNextPath()` only allows paths starting with `/` (not `//`). Used in login form and `/auth/callback`.

### Guest mode

**Risk:** Guest data is device-local only; no cross-user leakage.

**Note:** Guest lists are in `localStorage`. They are not encrypted — expected for guest mode.

### Account deletion

**Mitigation:** `delete_own_account(p_confirmation text)` runs as the authenticated user via RPC (`auth.uid()`). RPC rejects wrong confirmation phrase; UI also requires typing `delete my account`.

### HTTP headers

**Mitigation:** Production responses include `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy` (see `next.config.ts`).

### Secrets in git

**Mitigation:** `npm run check:secrets` before deploy. `.env.local` is gitignored.

---

## 6. Manual smoke tests (production URL)

Test on a **real phone** (PWA install flow matters).

### Auth

- [ ] Sign up → sign in → land on `/home`
- [ ] Sign out from Settings → returns to login
- [ ] Guest mode → create list → sign up → guest lists import

### Lists

- [ ] Create list, add items (`milk`, `tomatoes`) → categories assign
- [ ] Toggle **Group by category** off/on
- [ ] Check items → **Clear done** from ⋯ menu
- [ ] Swipe delete item (no second confirm)
- [ ] Share list → open link in second account/browser → collaborator sees changes within ~1s (Realtime)
- [ ] New collaborator appears in member chips without refresh

### Recipes

- [ ] Create recipe, share, clone, add to list with servings scale
- [ ] Two accounts on shared recipe → edit on A appears on B within ~1s

### Settings

- [ ] Save first/last name → greeting updates
- [ ] Change language → UI updates
- [ ] Email shown read-only
- [ ] Delete account dialog → typed confirmation (use a **throwaway** test account)

### PWA & offline

- [ ] Install banner / Add to Home Screen works
- [ ] `/manifest.webmanifest` loads (not redirected to login)
- [ ] Icons render after install
- [ ] Open a list → airplane mode → cached list visible, offline banner shown, edits blocked

### Share links

- [ ] List share URL uses `NEXT_PUBLIC_APP_URL` (not localhost)
- [ ] Expired list link shows clear error

### Health

- [ ] `GET /api/health` returns `{"ok":true}`

---

## 7. Post-deploy monitoring

Weekly 5-minute review:

- [ ] [Vercel → Analytics](https://vercel.com/dashboard) — traffic and Web Vitals (Speed Insights enabled in app)
- [ ] [Vercel → Logs / Functions](https://vercel.com/dashboard) — no repeated 500s on server actions
- [ ] [Supabase → Logs](https://supabase.com/dashboard) → Auth / API — unusual spikes
- [ ] `GET https://your-domain/api/health` — uptime check
- [ ] Set up Supabase **billing alerts** if on a paid plan

Client errors are logged to the browser console via `reportClientError` in error boundaries (check Vercel function logs for server-side failures).

---

## 8. Known limitations (v1)

| Item | Status |
|------|--------|
| Realtime sync | Supabase Realtime for lists + recipes; refetch-on-event |
| Offline auth lists | Read-only from session cache; no write queue |
| Offline guest lists | Full read/write via localStorage |
| Social login | Email/password only |
| Theme in Settings UI | Schema exists; UI not exposed yet |
| iOS home screen icon | May need remove + re-add after icon updates |

---

## 9. Launch day

1. Run `npm run prelaunch` locally one last time
2. Run `npm run verify:security` and `npm run check:realtime`
3. Confirm Supabase migrations + Realtime toggles + Auth URLs
4. Confirm Vercel env vars + redeploy
5. Complete smoke tests on production URL
6. Install PWA on your phone and use it for a real shopping trip

When all boxes are checked, you are ready to launch.
