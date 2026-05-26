-- Self-service account deletion: removes user-owned data then auth user

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Owned lists (cascades items, members, share links on those lists)
  delete from public.lists where owner_id = uid;

  -- Membership on others' lists
  delete from public.list_members where user_id = uid;

  -- Owned recipes (cascades ingredients)
  delete from public.recipes where owner_id = uid;

  -- View access & clones
  delete from public.recipe_access where user_id = uid;
  delete from public.recipe_clones where cloned_by = uid;

  -- Remaining share links created by user
  delete from public.share_links where created_by = uid;

  -- Profile + auth user (profile cascades from auth.users)
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
