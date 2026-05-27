-- Provisionly v1: core schema
-- Extensions
create extension if not exists "pgcrypto" with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.share_resource_type as enum ('list', 'recipe');
create type public.list_member_role as enum ('editor');
create type public.theme_preference as enum ('system', 'light', 'dark');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.normalize_item_name(input text)
returns text
language sql
immutable
as $$
  select lower(trim(regexp_replace(coalesce(input, ''), '\s+', ' ', 'g')));
$$;

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'en'
    check (locale in ('en', 'de', 'fr', 'nl', 'da', 'sv', 'no', 'fi')),
  theme public.theme_preference not null default 'system',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Categories (fixed global set; labels are multilingual JSON)
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sort_order int not null default 0,
  color text not null default '#94A3B8',
  labels jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.category_aliases (
  id uuid primary key default gen_random_uuid(),
  alias_normalized text not null,
  category_id uuid not null references public.categories (id) on delete cascade,
  language text check (
    language is null
    or language in ('en', 'de', 'fr', 'nl', 'da', 'sv', 'no', 'fi')
  ),
  created_at timestamptz not null default timezone('utc', now()),
  unique (alias_normalized, language)
);

create index category_aliases_lookup_idx
  on public.category_aliases (alias_normalized);

-- ---------------------------------------------------------------------------
-- Grocery lists
-- ---------------------------------------------------------------------------
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Shopping list',
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger lists_set_updated_at
  before update on public.lists
  for each row execute function public.set_updated_at();

create table public.list_members (
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.list_member_role not null default 'editor',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (list_id, user_id)
);

create index list_members_user_id_idx on public.list_members (user_id);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  name_original text not null,
  name_normalized text not null,
  quantity numeric,
  unit text,
  category_id uuid references public.categories (id) on delete set null,
  checked boolean not null default false,
  sort_key text not null default 'a0',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger list_items_set_updated_at
  before update on public.list_items
  for each row execute function public.set_updated_at();

create index list_items_list_id_idx on public.list_items (list_id);
create index list_items_list_normalized_idx on public.list_items (list_id, name_normalized);

-- ---------------------------------------------------------------------------
-- Share links (lists expire; recipes do not)
-- ---------------------------------------------------------------------------
create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  resource_type public.share_resource_type not null,
  resource_id uuid not null,
  token_hash text not null unique,
  expires_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint share_links_expires_check check (
    (resource_type = 'list' and expires_at is not null)
    or (resource_type = 'recipe' and expires_at is null)
  )
);

create index share_links_resource_idx
  on public.share_links (resource_type, resource_id);

-- ---------------------------------------------------------------------------
-- Recipes
-- ---------------------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  instructions text not null default '',
  tags text[] not null default '{}',
  default_servings int not null default 4 check (default_servings > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  name_original text not null,
  name_normalized text not null,
  quantity numeric,
  unit text,
  category_id uuid references public.categories (id) on delete set null,
  position int not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index recipe_ingredients_recipe_id_idx
  on public.recipe_ingredients (recipe_id, position);

-- View-only access granted when a user opens a recipe share link
create table public.recipe_access (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (recipe_id, user_id)
);

create table public.recipe_clones (
  id uuid primary key default gen_random_uuid(),
  original_recipe_id uuid not null references public.recipes (id) on delete cascade,
  cloned_recipe_id uuid not null references public.recipes (id) on delete cascade,
  cloned_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Membership helpers (used by RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_list_owner(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.lists l
    where l.id = p_list_id and l.owner_id = auth.uid()
  );
$$;

create or replace function public.is_list_member(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.list_members lm
    where lm.list_id = p_list_id and lm.user_id = auth.uid()
  );
$$;

create or replace function public.can_access_list(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_list_owner(p_list_id) or public.is_list_member(p_list_id);
$$;

create or replace function public.is_recipe_owner(p_recipe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.recipes r
    where r.id = p_recipe_id and r.owner_id = auth.uid()
  );
$$;

create or replace function public.can_view_recipe(p_recipe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_recipe_owner(p_recipe_id)
    or exists (
      select 1 from public.recipe_access ra
      where ra.recipe_id = p_recipe_id and ra.user_id = auth.uid()
    );
$$;

-- Owner is always a list member (inserted by app on list create)
create or replace function public.add_list_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.list_members (list_id, user_id, role)
  values (new.id, new.owner_id, 'editor')
  on conflict do nothing;
  return new;
end;
$$;

create trigger lists_add_owner_member
  after insert on public.lists
  for each row execute function public.add_list_owner_as_member();

-- Realtime publication for collaborative lists
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.list_items;
alter publication supabase_realtime add table public.list_members;
