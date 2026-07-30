-- Require expiry on all share links (lists and recipes): 72-hour TTL at create time.
-- Does not revoke existing list_members / recipe_access grants.

alter table public.share_links
  drop constraint if exists share_links_expires_check;

update public.share_links
set expires_at = now() + interval '72 hours'
where expires_at is null;

alter table public.share_links
  alter column expires_at set not null;

alter table public.share_links
  add constraint share_links_expires_check check (expires_at is not null);
