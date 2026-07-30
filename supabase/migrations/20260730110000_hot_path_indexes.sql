-- Speed up repeated owner/access lookups on the main list and recipe paths.

create index if not exists lists_owner_id_idx on public.lists (owner_id);
create index if not exists recipes_owner_id_idx on public.recipes (owner_id);
create index if not exists recipe_access_user_id_idx on public.recipe_access (user_id);
