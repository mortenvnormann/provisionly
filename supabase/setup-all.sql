-- =============================================================================
-- Provisionly: run this ENTIRE file once in Supabase Dashboard → SQL Editor
-- Project: https://supabase.com/dashboard/project/kluldktojkkgoldqmftt/sql/new
-- =============================================================================

-- --- Migration: 20260526100000_initial_schema.sql ---
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

-- --- Migration: 20260526100100_rls_policies.sql ---
-- Provisionly v1: Row Level Security

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.category_aliases enable row level security;
alter table public.lists enable row level security;
alter table public.list_members enable row level security;
alter table public.list_items enable row level security;
alter table public.share_links enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_access enable row level security;
alter table public.recipe_clones enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Categories & aliases: public reference data (incl. guest PWA categorisation)
create policy "Anyone can read categories"
  on public.categories for select
  using (true);

create policy "Anyone can read category aliases"
  on public.category_aliases for select
  using (true);

-- Lists
create policy "Members can view lists"
  on public.lists for select
  to authenticated
  using (public.can_access_list(id));

create policy "Users can create lists"
  on public.lists for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Members can update lists"
  on public.lists for update
  to authenticated
  using (public.can_access_list(id))
  with check (public.can_access_list(id));

create policy "Owners can delete lists"
  on public.lists for delete
  to authenticated
  using (public.is_list_owner(id));

-- List members
create policy "Members can view list membership"
  on public.list_members for select
  to authenticated
  using (public.can_access_list(list_id));

create policy "Members can add collaborators"
  on public.list_members for insert
  to authenticated
  with check (
    public.can_access_list(list_id)
    and user_id is not null
  );

create policy "Owners can remove collaborators"
  on public.list_members for delete
  to authenticated
  using (
    public.is_list_owner(list_id)
    or user_id = auth.uid()
  );

-- List items
create policy "Members can view list items"
  on public.list_items for select
  to authenticated
  using (public.can_access_list(list_id));

create policy "Members can add list items"
  on public.list_items for insert
  to authenticated
  with check (public.can_access_list(list_id));

create policy "Members can update list items"
  on public.list_items for update
  to authenticated
  using (public.can_access_list(list_id))
  with check (public.can_access_list(list_id));

create policy "Members can delete list items"
  on public.list_items for delete
  to authenticated
  using (public.can_access_list(list_id));

-- Share links: only creator can manage; validation via RPC in app layer
create policy "Creators can view own share links"
  on public.share_links for select
  to authenticated
  using (created_by = auth.uid());

create policy "Members can create share links for accessible lists"
  on public.share_links for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      (resource_type = 'list' and public.can_access_list(resource_id))
      or (resource_type = 'recipe' and public.can_view_recipe(resource_id))
    )
  );

create policy "Creators can delete share links"
  on public.share_links for delete
  to authenticated
  using (created_by = auth.uid());

-- Recipes
create policy "Users can view accessible recipes"
  on public.recipes for select
  to authenticated
  using (public.can_view_recipe(id));

create policy "Users can create recipes"
  on public.recipes for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can update recipes"
  on public.recipes for update
  to authenticated
  using (public.is_recipe_owner(id))
  with check (public.is_recipe_owner(id));

create policy "Owners can delete recipes"
  on public.recipes for delete
  to authenticated
  using (public.is_recipe_owner(id));

-- Recipe ingredients
create policy "Users can view recipe ingredients"
  on public.recipe_ingredients for select
  to authenticated
  using (public.can_view_recipe(recipe_id));

create policy "Owners can manage recipe ingredients"
  on public.recipe_ingredients for insert
  to authenticated
  with check (public.is_recipe_owner(recipe_id));

create policy "Owners can update recipe ingredients"
  on public.recipe_ingredients for update
  to authenticated
  using (public.is_recipe_owner(recipe_id))
  with check (public.is_recipe_owner(recipe_id));

create policy "Owners can delete recipe ingredients"
  on public.recipe_ingredients for delete
  to authenticated
  using (public.is_recipe_owner(recipe_id));

-- Recipe access (granted via share flow)
create policy "Users can view own recipe access rows"
  on public.recipe_access for select
  to authenticated
  using (user_id = auth.uid() or public.is_recipe_owner(recipe_id));

create policy "Users can grant self recipe access"
  on public.recipe_access for insert
  to authenticated
  with check (user_id = auth.uid());

-- Recipe clones (audit trail)
create policy "Users can view own clone records"
  on public.recipe_clones for select
  to authenticated
  using (cloned_by = auth.uid());

create policy "Users can record recipe clones"
  on public.recipe_clones for insert
  to authenticated
  with check (cloned_by = auth.uid());

-- --- Migration: 20260526100200_seed_categories.sql ---
-- Provisionly v1: global grocery categories + starter aliases

insert into public.categories (slug, sort_order, color, labels) values
  (
    'produce',
    10,
    '#4ADE80',
    '{"en":"Produce","de":"Obst & Gemüse","fr":"Fruits & légumes","nl":"Groente & fruit","da":"Frugt & grønt","sv":"Frukt & grönt","no":"Frukt & grønt","fi":"Hedelmät & vihannekset"}'::jsonb
  ),
  (
    'dairy',
    20,
    '#38BDF8',
    '{"en":"Dairy","de":"Milchprodukte","fr":"Produits laitiers","nl":"Zuivel","da":"Mejeri","sv":"Mejeri","no":"Meieri","fi":"Maitotuotteet"}'::jsonb
  ),
  (
    'meat_fish',
    30,
    '#F87171',
    '{"en":"Meat & fish","de":"Fleisch & Fisch","fr":"Viande & poisson","nl":"Vlees & vis","da":"Kød & fisk","sv":"Kött & fisk","no":"Kjøtt & fisk","fi":"Liha & kala"}'::jsonb
  ),
  (
    'bakery',
    40,
    '#FBBF24',
    '{"en":"Bakery","de":"Backwaren","fr":"Boulangerie","nl":"Brood & gebak","da":"Bageri","sv":"Bageri","no":"Bakeri","fi":"Leipomo"}'::jsonb
  ),
  (
    'frozen',
    50,
    '#67E8F9',
    '{"en":"Frozen","de":"Tiefkühl","fr":"Surgelés","nl":"Diepvries","da":"Frost","sv":"Fryst","no":"Frossen","fi":"Pakaste"}'::jsonb
  ),
  (
    'pantry',
    60,
    '#C4B5FD',
    '{"en":"Pantry","de":"Vorrat","fr":"Épicerie","nl":"Voorraad","da":"Tørvare","sv":"Skafferi","no":"Tørrvarer","fi":"Kuivatuotteet"}'::jsonb
  ),
  (
    'beverages',
    70,
    '#60A5FA',
    '{"en":"Beverages","de":"Getränke","fr":"Boissons","nl":"Dranken","da":"Drikkevarer","sv":"Drycker","no":"Drikke","fi":"Juomat"}'::jsonb
  ),
  (
    'snacks',
    80,
    '#FB923C',
    '{"en":"Snacks","de":"Snacks","fr":"Snacks","nl":"Snacks","da":"Snacks","sv":"Snacks","no":"Snacks","fi":"Snacks"}'::jsonb
  ),
  (
    'household',
    90,
    '#A8A29E',
    '{"en":"Household","de":"Haushalt","fr":"Maison","nl":"Huishouden","da":"Husholdning","sv":"Hushåll","no":"Husholdning","fi":"Koti"}'::jsonb
  ),
  (
    'general',
    100,
    '#94A3B8',
    '{"en":"General","de":"Sonstiges","fr":"Général","nl":"Overig","da":"Andet","sv":"Övrigt","no":"Annet","fi":"Muu"}'::jsonb
  );

-- Starter aliases (language-specific + language-null fallback)
-- Produce
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('apple', 'en'), ('apples', 'en'), ('banana', 'en'), ('bananas', 'en'),
    ('tomato', 'en'), ('tomatoes', 'en'), ('onion', 'en'), ('onions', 'en'),
    ('potato', 'en'), ('potatoes', 'en'), ('carrot', 'en'), ('carrots', 'en'),
    ('lettuce', 'en'), ('cucumber', 'en'), ('pepper', 'en'), ('garlic', 'en'),
    ('apfel', 'de'), ('äpfel', 'de'), ('banane', 'de'), ('tomate', 'de'),
    ('tomaten', 'de'), ('zwiebel', 'de'), ('kartoffel', 'de'), ('karotte', 'de'),
    ('pomme', 'fr'), ('pommes', 'fr'), ('banane', 'fr'), ('tomate', 'fr'),
    ('oignon', 'fr'), ('pomme de terre', 'fr'), ('carotte', 'fr'),
    ('appel', 'nl'), ('appels', 'nl'), ('banaan', 'nl'), ('tomaat', 'nl'),
    ('ui', 'nl'), ('aardappel', 'nl'), ('wortel', 'nl'),
    ('æble', 'da'), ('æbler', 'da'), ('banan', 'da'), ('tomat', 'da'),
    ('tomater', 'da'), ('løg', 'da'), ('kartoffel', 'da'), ('gulerod', 'da'),
    ('äpple', 'sv'), ('banan', 'sv'), ('tomat', 'sv'), ('lök', 'sv'),
    ('potatis', 'sv'), ('morot', 'sv'),
    ('eple', 'no'), ('banan', 'no'), ('tomat', 'no'), ('løk', 'no'),
    ('potet', 'no'), ('gulrot', 'no'),
    ('omena', 'fi'), ('banaani', 'fi'), ('tomaatti', 'fi'), ('sipuli', 'fi'),
    ('peruna', 'fi'), ('porkkana', 'fi')
) as v(alias, lang)
where c.slug = 'produce';

-- Dairy
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('milk', 'en'), ('cheese', 'en'), ('butter', 'en'), ('yogurt', 'en'),
    ('cream', 'en'), ('eggs', 'en'), ('egg', 'en'),
    ('milch', 'de'), ('käse', 'de'), ('butter', 'de'), ('joghurt', 'de'),
    ('sahne', 'de'), ('eier', 'de'),
    ('lait', 'fr'), ('fromage', 'fr'), ('beurre', 'fr'), ('yaourt', 'fr'),
    ('crème', 'fr'), ('oeufs', 'fr'),
    ('melk', 'nl'), ('kaas', 'nl'), ('boter', 'nl'), ('yoghurt', 'nl'),
    ('room', 'nl'), ('eieren', 'nl'),
    ('mælk', 'da'), ('ost', 'da'), ('smør', 'da'), ('yoghurt', 'da'),
    ('fløde', 'da'), ('æg', 'da'),
    ('mjölk', 'sv'), ('ost', 'sv'), ('smör', 'sv'), ('yoghurt', 'sv'),
    ('grädde', 'sv'), ('ägg', 'sv'),
    ('melk', 'no'), ('ost', 'no'), ('smør', 'no'), ('yoghurt', 'no'),
    ('fløte', 'no'), ('egg', 'no'),
    ('maito', 'fi'), ('juusto', 'fi'), ('voi', 'fi'), ('jugurtti', 'fi'),
    ('kerma', 'fi'), ('kananmunat', 'fi')
) as v(alias, lang)
where c.slug = 'dairy';

-- Meat & fish
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('chicken', 'en'), ('beef', 'en'), ('pork', 'en'), ('salmon', 'en'),
    ('fish', 'en'), ('mince', 'en'), ('bacon', 'en'),
    ('hähnchen', 'de'), ('rindfleisch', 'de'), ('schweinefleisch', 'de'),
    ('lachs', 'de'), ('fisch', 'de'), ('hackfleisch', 'de'), ('speck', 'de'),
    ('poulet', 'fr'), ('boeuf', 'fr'), ('porc', 'fr'), ('saumon', 'fr'),
    ('poisson', 'fr'), ('lard', 'fr'),
    ('kip', 'nl'), ('rundvlees', 'nl'), ('varkensvlees', 'nl'),
    ('zalm', 'nl'), ('vis', 'nl'), ('spek', 'nl'),
    ('kylling', 'da'), ('oksekød', 'da'), ('svinekød', 'da'),
    ('laks', 'da'), ('fisk', 'da'), ('bacon', 'da'),
    ('kyckling', 'sv'), ('nötkött', 'sv'), ('fläsk', 'sv'),
    ('lax', 'sv'), ('fisk', 'sv'), ('bacon', 'sv'),
    ('kylling', 'no'), ('storfekjøtt', 'no'), ('svinekjøtt', 'no'),
    ('laks', 'no'), ('fisk', 'no'), ('bacon', 'no'),
    ('kana', 'fi'), ('naudanliha', 'fi'), ('sianliha', 'fi'),
    ('lohi', 'fi'), ('kala', 'fi'), ('pekoni', 'fi')
) as v(alias, lang)
where c.slug = 'meat_fish';

-- Bakery
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('bread', 'en'), ('baguette', 'en'), ('rolls', 'en'), ('croissant', 'en'),
    ('brot', 'de'), ('brötchen', 'de'), ('baguette', 'de'),
    ('pain', 'fr'), ('baguette', 'fr'), ('croissant', 'fr'),
    ('brood', 'nl'), ('bolletjes', 'nl'),
    ('brød', 'da'), ('boller', 'da'),
    ('bröd', 'sv'), ('frallor', 'sv'),
    ('brød', 'no'), ('rundstykker', 'no'),
    ('leipä', 'fi'), ('sämpylä', 'fi')
) as v(alias, lang)
where c.slug = 'bakery';

-- Pantry
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('rice', 'en'), ('pasta', 'en'), ('flour', 'en'), ('sugar', 'en'),
    ('salt', 'en'), ('oil', 'en'), ('olive oil', 'en'), ('beans', 'en'),
    ('reis', 'de'), ('nudeln', 'de'), ('mehl', 'de'), ('zucker', 'de'),
    ('salz', 'de'), ('öl', 'de'), ('olivenöl', 'de'),
    ('riz', 'fr'), ('pâtes', 'fr'), ('farine', 'fr'), ('sucre', 'fr'),
    ('sel', 'fr'), ('huile', 'fr'),
    ('rijst', 'nl'), ('pasta', 'nl'), ('bloem', 'nl'), ('suiker', 'nl'),
    ('zout', 'nl'), ('olie', 'nl'),
    ('ris', 'da'), ('pasta', 'da'), ('mel', 'da'), ('sukker', 'da'),
    ('salt', 'da'), ('olie', 'da'),
    ('ris', 'sv'), ('pasta', 'sv'), ('mjöl', 'sv'), ('socker', 'sv'),
    ('salt', 'sv'), ('olja', 'sv'),
    ('ris', 'no'), ('pasta', 'no'), ('mel', 'no'), ('sukker', 'no'),
    ('salt', 'no'), ('olje', 'no'),
    ('riisi', 'fi'), ('pasta', 'fi'), ('jauho', 'fi'), ('sokeri', 'fi'),
    ('suola', 'fi'), ('öljy', 'fi')
) as v(alias, lang)
where c.slug = 'pantry';

-- Beverages
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('water', 'en'), ('juice', 'en'), ('coffee', 'en'), ('tea', 'en'),
    ('beer', 'en'), ('wine', 'en'), ('soda', 'en'),
    ('wasser', 'de'), ('saft', 'de'), ('kaffee', 'de'), ('tee', 'de'),
    ('bier', 'de'), ('wein', 'de'),
    ('eau', 'fr'), ('jus', 'fr'), ('café', 'fr'), ('thé', 'fr'),
    ('bière', 'fr'), ('vin', 'fr'),
    ('water', 'nl'), ('sap', 'nl'), ('koffie', 'nl'), ('thee', 'nl'),
    ('bier', 'nl'), ('wijn', 'nl'),
    ('vand', 'da'), ('juice', 'da'), ('kaffe', 'da'), ('te', 'da'),
    ('øl', 'da'), ('vin', 'da'),
    ('vatten', 'sv'), ('juice', 'sv'), ('kaffe', 'sv'), ('te', 'sv'),
    ('öl', 'sv'), ('vin', 'sv'),
    ('vann', 'no'), ('juice', 'no'), ('kaffe', 'no'), ('te', 'no'),
    ('øl', 'no'), ('vin', 'no'),
    ('vesi', 'fi'), ('mehu', 'fi'), ('kahvi', 'fi'), ('tee', 'fi'),
    ('olut', 'fi'), ('viini', 'fi')
) as v(alias, lang)
where c.slug = 'beverages';

-- Language-agnostic fallbacks (null language = matches any locale)
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, null
from public.categories c
cross join (values ('salt'), ('sugar'), ('oil')) as v(alias)
where c.slug = 'pantry';

insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, null
from public.categories c
cross join (values ('water')) as v(alias)
where c.slug = 'beverages';

-- Resolve category for an item name (used by app / RPC later)
create or replace function public.resolve_category_id(p_name text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select public.normalize_item_name(p_name) as n
  )
  select coalesce(
    (
      select ca.category_id
      from public.category_aliases ca, normalized n
      where ca.alias_normalized = n.n
      order by ca.language nulls last
      limit 1
    ),
    (select id from public.categories where slug = 'general' limit 1)
  );
$$;

grant execute on function public.resolve_category_id(text) to authenticated;

-- --- Migration: 20260526100300_account_deletion.sql ---
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

-- --- Migration: 20260526100400_grant_anon_resolve_category.sql ---
-- Guests (anon) can resolve categories when online; offline uses cached aliases.
grant execute on function public.resolve_category_id(text) to anon;

-- --- Migration: 20260527100000_recipe_description.sql ---
alter table public.recipes
  add column if not exists description text not null default '';

-- --- Migration: 20260528100000_list_grouping_and_profile_names.sql ---
alter table public.lists
  add column if not exists group_by_category boolean not null default true;

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

