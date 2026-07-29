-- Recipe photos: optional single image per recipe in Supabase Storage

alter table public.recipes
  add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-images',
  'recipe-images',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Recipe owners manage photos" on storage.objects;
create policy "Recipe owners manage photos"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'recipe-images'
    and public.is_recipe_owner(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'recipe-images'
    and public.is_recipe_owner(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Recipe viewers read photos" on storage.objects;
create policy "Recipe viewers read photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'recipe-images'
    and public.can_view_recipe(((storage.foldername(name))[1])::uuid)
  );

-- Remove recipe photos before deleting owned recipes during account deletion
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

  delete from storage.objects
  where bucket_id = 'recipe-images'
    and (storage.foldername(name))[1]::uuid in (
      select id from public.recipes where owner_id = uid
    );

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
