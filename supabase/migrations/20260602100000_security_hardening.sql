-- Security hardening: tighten permissive RLS policies and account deletion RPC

-- recipe_access: revoke self-grant via PostgREST (join flow uses service role)
drop policy if exists "Users can grant self recipe access" on public.recipe_access;

-- list_members: only owners may add collaborators (share joins use service role)
drop policy if exists "Members can add collaborators" on public.list_members;

create policy "Owners can add collaborators"
  on public.list_members for insert
  to authenticated
  with check (
    public.is_list_owner(list_id)
    and user_id is not null
  );

-- Account deletion: require confirmation phrase in RPC (not UI-only)
drop function if exists public.delete_own_account();

create or replace function public.delete_own_account(p_confirmation text)
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

  if p_confirmation is distinct from 'delete my account' then
    raise exception 'Confirmation phrase required';
  end if;

  delete from public.lists where owner_id = uid;
  delete from public.list_members where user_id = uid;
  delete from public.recipes where owner_id = uid;
  delete from public.recipe_access where user_id = uid;
  delete from public.recipe_clones where cloned_by = uid;
  delete from public.share_links where created_by = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account(text) from public;
grant execute on function public.delete_own_account(text) to authenticated;
