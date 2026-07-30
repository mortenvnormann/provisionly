-- =============================================================================
-- Provisionly: run this ENTIRE file once in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/_/sql/new
-- Generated from supabase/migrations/ — do not edit by hand; run: npm run db:bundle
-- =============================================================================

-- --- 20260526100000_initial_schema.sql ---
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

create index lists_owner_id_idx on public.lists (owner_id);

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
-- Share links (all invite links expire; joined access is separate)
-- ---------------------------------------------------------------------------
create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  resource_type public.share_resource_type not null,
  resource_id uuid not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint share_links_expires_check check (expires_at is not null)
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

create index recipes_owner_id_idx on public.recipes (owner_id);

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

create index recipe_access_user_id_idx on public.recipe_access (user_id);

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


-- --- 20260526100100_rls_policies.sql ---
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


-- --- 20260526100200_seed_categories.sql ---
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


-- --- 20260526100300_account_deletion.sql ---
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


-- --- 20260526100400_grant_anon_resolve_category.sql ---
-- Guests (anon) can resolve categories when online; offline uses cached aliases.
grant execute on function public.resolve_category_id(text) to anon;


-- --- 20260527100000_recipe_description.sql ---
-- Optional notes/comments on recipes (separate from step-by-step instructions)
alter table public.recipes
  add column if not exists description text not null default '';


-- --- 20260528100000_list_grouping_and_profile_names.sql ---
-- Per-list category grouping + profile first/last name

alter table public.lists
  add column if not exists group_by_category boolean not null default true;

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;


-- --- 20260601100000_expand_category_aliases.sql ---
-- Provisionly v1.1: expand category alias dictionary
-- Generated by scripts/bundle-aliases.mjs — do not edit by hand
-- Total aliases: 1575

-- produce (175)
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('apple', 'en'),
    ('apfel', 'de'),
    ('pomme', 'fr'),
    ('appel', 'nl'),
    ('æble', 'da'),
    ('äpple', 'sv'),
    ('eple', 'no'),
    ('omena', 'fi'),
    ('avocado', null),
    ('apples', 'en'),
    ('äpfel', 'de'),
    ('pommes', 'fr'),
    ('appels', 'nl'),
    ('æbler', 'da'),
    ('banan', 'sv'),
    ('epler', 'no'),
    ('omenat', 'fi'),
    ('mango', null),
    ('banana', 'en'),
    ('banane', 'de'),
    ('banane', 'fr'),
    ('banaan', 'nl'),
    ('banan', 'da'),
    ('apelsin', 'sv'),
    ('banan', 'no'),
    ('banaani', 'fi'),
    ('basil', null),
    ('bananas', 'en'),
    ('bananen', 'de'),
    ('orange', 'fr'),
    ('sinaasappel', 'nl'),
    ('appelsin', 'da'),
    ('citron', 'sv'),
    ('appelsin', 'no'),
    ('appelsiini', 'fi'),
    ('mint', null),
    ('orange', 'en'),
    ('orange', 'de'),
    ('citron', 'fr'),
    ('citroen', 'nl'),
    ('citron', 'da'),
    ('lime', 'sv'),
    ('sitron', 'no'),
    ('sitruuna', 'fi'),
    ('ginger', null),
    ('oranges', 'en'),
    ('orangen', 'de'),
    ('citron vert', 'fr'),
    ('limoen', 'nl'),
    ('lime', 'da'),
    ('druva', 'sv'),
    ('lime', 'no'),
    ('lime', 'fi'),
    ('lemon', 'en'),
    ('zitrone', 'de'),
    ('raisin', 'fr'),
    ('druif', 'nl'),
    ('drue', 'da'),
    ('druvor', 'sv'),
    ('drue', 'no'),
    ('viinirypäle', 'fi'),
    ('lemons', 'en'),
    ('zitronen', 'de'),
    ('fraise', 'fr'),
    ('druiven', 'nl'),
    ('druer', 'da'),
    ('jordgubbe', 'sv'),
    ('druer', 'no'),
    ('mansikka', 'fi'),
    ('lime', 'en'),
    ('limette', 'de'),
    ('myrtille', 'fr'),
    ('aardbei', 'nl'),
    ('jordbær', 'da'),
    ('jordgubbar', 'sv'),
    ('jordbær', 'no'),
    ('mansikat', 'fi'),
    ('grape', 'en'),
    ('traube', 'de'),
    ('framboise', 'fr'),
    ('aardbeien', 'nl'),
    ('blåbær', 'da'),
    ('blåbär', 'sv'),
    ('blåbær', 'no'),
    ('mustikka', 'fi'),
    ('grapes', 'en'),
    ('trauben', 'de'),
    ('mûre', 'fr'),
    ('bosbes', 'nl'),
    ('hindbær', 'da'),
    ('hallon', 'sv'),
    ('bringebær', 'no'),
    ('vadelma', 'fi'),
    ('strawberry', 'en'),
    ('erdbeere', 'de'),
    ('cerise', 'fr'),
    ('framboos', 'nl'),
    ('brombær', 'da'),
    ('björnbär', 'sv'),
    ('bjørnebær', 'no'),
    ('karhunvatukka', 'fi'),
    ('strawberries', 'en'),
    ('erdbeeren', 'de'),
    ('pêche', 'fr'),
    ('braam', 'nl'),
    ('kirsebær', 'da'),
    ('körsbär', 'sv'),
    ('kirsebær', 'no'),
    ('kirsikka', 'fi'),
    ('blueberry', 'en'),
    ('heidelbeere', 'de'),
    ('poire', 'fr'),
    ('kers', 'nl'),
    ('fersken', 'da'),
    ('persika', 'sv'),
    ('fersken', 'no'),
    ('persikka', 'fi'),
    ('blueberries', 'en'),
    ('himbeere', 'de'),
    ('prune', 'fr'),
    ('perzik', 'nl'),
    ('pære', 'da'),
    ('päron', 'sv'),
    ('pære', 'no'),
    ('päärynä', 'fi'),
    ('raspberry', 'en'),
    ('brombeere', 'de'),
    ('mangue', 'fr'),
    ('peer', 'nl'),
    ('blomme', 'da'),
    ('plommon', 'sv'),
    ('plomme', 'no'),
    ('luumu', 'fi'),
    ('raspberries', 'en'),
    ('kirsche', 'de'),
    ('ananas', 'fr'),
    ('pruim', 'nl'),
    ('mango', 'da'),
    ('mango', 'sv'),
    ('mango', 'no'),
    ('mango', 'fi'),
    ('blackberry', 'en'),
    ('kirschen', 'de'),
    ('pastèque', 'fr'),
    ('mango', 'nl'),
    ('ananas', 'da'),
    ('ananas', 'sv'),
    ('ananas', 'no'),
    ('ananas', 'fi'),
    ('blackberries', 'en'),
    ('pfirsich', 'de'),
    ('melon', 'fr'),
    ('ananas', 'nl'),
    ('vandmelon', 'da'),
    ('vattenmelon', 'sv'),
    ('vannmelon', 'no'),
    ('vesimeloni', 'fi'),
    ('cherry', 'en'),
    ('birne', 'de'),
    ('kiwi', 'fr'),
    ('watermeloen', 'nl'),
    ('melon', 'da'),
    ('melon', 'sv'),
    ('melon', 'no'),
    ('meloni', 'fi'),
    ('cherries', 'en'),
    ('pflaume', 'de'),
    ('avocat', 'fr'),
    ('meloen', 'nl'),
    ('kiwi', 'da'),
    ('kiwi', 'sv'),
    ('kiwi', 'no'),
    ('kiivi', 'fi'),
    ('peach', 'en'),
    ('mango', 'de')
) as v(alias, lang)
where c.slug = 'produce'
on conflict (alias_normalized, language) do nothing;

-- dairy (135)
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('milk', 'en'),
    ('milch', 'de'),
    ('lait', 'fr'),
    ('melk', 'nl'),
    ('mælk', 'da'),
    ('mjölk', 'sv'),
    ('melk', 'no'),
    ('maito', 'fi'),
    ('milk', null),
    ('semi-skimmed milk', 'en'),
    ('haltbare milch', 'de'),
    ('lait demi-écrémé', 'fr'),
    ('halfvolle melk', 'nl'),
    ('letmælk', 'da'),
    ('lättmjölk', 'sv'),
    ('lettmelk', 'no'),
    ('kevytmaito', 'fi'),
    ('cheese', null),
    ('skimmed milk', 'en'),
    ('hafermilch', 'de'),
    ('lait écrémé', 'fr'),
    ('magere melk', 'nl'),
    ('skummetmælk', 'da'),
    ('skummjölk', 'sv'),
    ('skummet melk', 'no'),
    ('rasvaton maito', 'fi'),
    ('butter', null),
    ('whole milk', 'en'),
    ('mandelmilch', 'de'),
    ('lait entier', 'fr'),
    ('volle melk', 'nl'),
    ('sødmælk', 'da'),
    ('standardmjölk', 'sv'),
    ('helmelk', 'no'),
    ('täysmaito', 'fi'),
    ('yogurt', null),
    ('oat milk', 'en'),
    ('sojamilch', 'de'),
    ('lait d''avoine', 'fr'),
    ('havermelk', 'nl'),
    ('havremælk', 'da'),
    ('havremjölk', 'sv'),
    ('havremelk', 'no'),
    ('kauramaito', 'fi'),
    ('cream', null),
    ('almond milk', 'en'),
    ('käse', 'de'),
    ('lait d''amande', 'fr'),
    ('amandelmelk', 'nl'),
    ('mandelmælk', 'da'),
    ('mandelmjölk', 'sv'),
    ('mandelmelk', 'no'),
    ('mantelimaito', 'fi'),
    ('eggs', null),
    ('soy milk', 'en'),
    ('cheddar', 'de'),
    ('lait de soja', 'fr'),
    ('sojamelk', 'nl'),
    ('sojamælk', 'da'),
    ('sojamjölk', 'sv'),
    ('soyamelk', 'no'),
    ('soijamaito', 'fi'),
    ('cheese', 'en'),
    ('mozzarella', 'de'),
    ('fromage', 'fr'),
    ('kaas', 'nl'),
    ('ost', 'da'),
    ('ost', 'sv'),
    ('ost', 'no'),
    ('juusto', 'fi'),
    ('cheddar', 'en'),
    ('parmesan', 'de'),
    ('cheddar', 'fr'),
    ('cheddar', 'nl'),
    ('cheddar', 'da'),
    ('cheddar', 'sv'),
    ('cheddar', 'no'),
    ('cheddar', 'fi'),
    ('mozzarella', 'en'),
    ('feta', 'de'),
    ('mozzarella', 'fr'),
    ('mozzarella', 'nl'),
    ('mozzarella', 'da'),
    ('mozzarella', 'sv'),
    ('mozzarella', 'no'),
    ('mozzarella', 'fi'),
    ('parmesan', 'en'),
    ('brie', 'de'),
    ('parmesan', 'fr'),
    ('parmezaan', 'nl'),
    ('parmesan', 'da'),
    ('parmesan', 'sv'),
    ('parmesan', 'no'),
    ('parmesaani', 'fi'),
    ('feta', 'en'),
    ('camembert', 'de'),
    ('feta', 'fr'),
    ('feta', 'nl'),
    ('feta', 'da'),
    ('feta', 'sv'),
    ('feta', 'no'),
    ('feta', 'fi'),
    ('brie', 'en'),
    ('frischkäse', 'de'),
    ('brie', 'fr'),
    ('brie', 'nl'),
    ('brie', 'da'),
    ('brie', 'sv'),
    ('brie', 'no'),
    ('brie', 'fi'),
    ('camembert', 'en'),
    ('hüttenkäse', 'de'),
    ('camembert', 'fr'),
    ('camembert', 'nl'),
    ('camembert', 'da'),
    ('camembert', 'sv'),
    ('camembert', 'no'),
    ('camembert', 'fi'),
    ('cream cheese', 'en'),
    ('ricotta', 'de'),
    ('fromage frais', 'fr'),
    ('roomkaas', 'nl'),
    ('flødeost', 'da'),
    ('färskost', 'sv'),
    ('kremost', 'no'),
    ('tuorejuusto', 'fi'),
    ('cottage cheese', 'en'),
    ('ziegenkäse', 'de'),
    ('cottage cheese', 'fr'),
    ('cottage cheese', 'nl'),
    ('cottage cheese', 'da'),
    ('cottage cheese', 'sv'),
    ('cottage cheese', 'no'),
    ('ricotta', 'fi'),
    ('ricotta', 'en')
) as v(alias, lang)
where c.slug = 'dairy'
on conflict (alias_normalized, language) do nothing;

-- meat_fish (155)
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('chicken', 'en'),
    ('hähnchen', 'de'),
    ('poulet', 'fr'),
    ('kip', 'nl'),
    ('kylling', 'da'),
    ('kyckling', 'sv'),
    ('kylling', 'no'),
    ('kana', 'fi'),
    ('bacon', null),
    ('chicken breast', 'en'),
    ('hähnchenbrust', 'de'),
    ('blanc de poulet', 'fr'),
    ('kipfilet', 'nl'),
    ('kyllingebryst', 'da'),
    ('kycklingbröst', 'sv'),
    ('kyllingbryst', 'no'),
    ('kananrinta', 'fi'),
    ('salmon', null),
    ('chicken thighs', 'en'),
    ('hähnchenschenkel', 'de'),
    ('cuisses de poulet', 'fr'),
    ('kippendijen', 'nl'),
    ('kyllingelår', 'da'),
    ('kycklinglår', 'sv'),
    ('kyllinglår', 'no'),
    ('kananreidet', 'fi'),
    ('tuna', null),
    ('chicken wings', 'en'),
    ('hähnchenflügel', 'de'),
    ('ailes de poulet', 'fr'),
    ('kippenvleugels', 'nl'),
    ('kyllingevinger', 'da'),
    ('kycklingvingar', 'sv'),
    ('kyllingvinger', 'no'),
    ('kanansiivet', 'fi'),
    ('sausage', null),
    ('whole chicken', 'en'),
    ('ganzes hähnchen', 'de'),
    ('poulet entier', 'fr'),
    ('hele kip', 'nl'),
    ('hel kylling', 'da'),
    ('hel kyckling', 'sv'),
    ('hel kylling', 'no'),
    ('kokonainen kana', 'fi'),
    ('ham', null),
    ('turkey', 'en'),
    ('pute', 'de'),
    ('dinde', 'fr'),
    ('kalkoen', 'nl'),
    ('kalkun', 'da'),
    ('kalkon', 'sv'),
    ('kalkun', 'no'),
    ('kalkkuna', 'fi'),
    ('duck', 'en'),
    ('ente', 'de'),
    ('canard', 'fr'),
    ('eend', 'nl'),
    ('and', 'da'),
    ('anka', 'sv'),
    ('and', 'no'),
    ('ankka', 'fi'),
    ('beef', 'en'),
    ('rindfleisch', 'de'),
    ('boeuf', 'fr'),
    ('rundvlees', 'nl'),
    ('oksekød', 'da'),
    ('nötkött', 'sv'),
    ('storfekjøtt', 'no'),
    ('naudanliha', 'fi'),
    ('steak', 'en'),
    ('steak', 'de'),
    ('steak', 'fr'),
    ('biefstuk', 'nl'),
    ('bøf', 'da'),
    ('biff', 'sv'),
    ('biff', 'no'),
    ('pihvi', 'fi'),
    ('sirloin', 'en'),
    ('rumpsteak', 'de'),
    ('rumsteck', 'fr'),
    ('runderlappen', 'nl'),
    ('entrecote', 'da'),
    ('entrecote', 'sv'),
    ('entrecôte', 'no'),
    ('jauheliha', 'fi'),
    ('ribeye', 'en'),
    ('entrecôte', 'de'),
    ('entrecôte', 'fr'),
    ('rundergehakt', 'nl'),
    ('hakket oksekød', 'da'),
    ('nötfärs', 'sv'),
    ('kjøttdeig', 'no'),
    ('naudan paisti', 'fi'),
    ('mince', 'en'),
    ('hackfleisch', 'de'),
    ('viande hachée', 'fr'),
    ('stoofvlees', 'nl'),
    ('oksegullasch', 'da'),
    ('grytbitar', 'sv'),
    ('oksekjøtt', 'no'),
    ('sianliha', 'fi'),
    ('ground beef', 'en'),
    ('rindergulasch', 'de'),
    ('boeuf bourguignon', 'fr'),
    ('varkensvlees', 'nl'),
    ('svinekød', 'da'),
    ('fläsk', 'sv'),
    ('svinekjøtt', 'no'),
    ('possun kyljykset', 'fi'),
    ('beef stew', 'en'),
    ('braten', 'de'),
    ('rôti de boeuf', 'fr'),
    ('varkenskoteletten', 'nl'),
    ('svinekoteletter', 'da'),
    ('fläskkotletter', 'sv'),
    ('svinekoteletter', 'no'),
    ('pekoni', 'fi'),
    ('roast beef', 'en'),
    ('schweinefleisch', 'de'),
    ('porc', 'fr'),
    ('buikspek', 'nl'),
    ('bacon', 'da'),
    ('bacon', 'sv'),
    ('bacon', 'no'),
    ('kinkku', 'fi'),
    ('pork', 'en'),
    ('schweinekoteletts', 'de'),
    ('côtelettes de porc', 'fr'),
    ('spek', 'nl'),
    ('skinke', 'da'),
    ('skinka', 'sv'),
    ('skinke', 'no'),
    ('makkara', 'fi'),
    ('pork chops', 'en'),
    ('schweinebauch', 'de'),
    ('poitrine de porc', 'fr'),
    ('ham', 'nl'),
    ('pølser', 'da'),
    ('korv', 'sv'),
    ('pølser', 'no'),
    ('makkarat', 'fi'),
    ('pork belly', 'en'),
    ('speck', 'de'),
    ('lard', 'fr'),
    ('worstjes', 'nl'),
    ('medister', 'da'),
    ('korvar', 'sv'),
    ('chorizo', 'no'),
    ('chorizo', 'fi'),
    ('bacon', 'en'),
    ('schinken', 'de'),
    ('jambon', 'fr'),
    ('worst', 'nl'),
    ('chorizo', 'da'),
    ('chorizo', 'sv')
) as v(alias, lang)
where c.slug = 'meat_fish'
on conflict (alias_normalized, language) do nothing;

-- bakery (95)
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('bread', 'en'),
    ('brot', 'de'),
    ('pain', 'fr'),
    ('brood', 'nl'),
    ('brød', 'da'),
    ('bröd', 'sv'),
    ('brød', 'no'),
    ('leipä', 'fi'),
    ('bread', null),
    ('white bread', 'en'),
    ('weißbrot', 'de'),
    ('pain blanc', 'fr'),
    ('wit brood', 'nl'),
    ('hvidt brød', 'da'),
    ('vitt bröd', 'sv'),
    ('hvitt brød', 'no'),
    ('valkoinen leipä', 'fi'),
    ('baguette', null),
    ('brown bread', 'en'),
    ('vollkornbrot', 'de'),
    ('pain complet', 'fr'),
    ('bruin brood', 'nl'),
    ('fuldkornsbrød', 'da'),
    ('fullkornsbröd', 'sv'),
    ('fullkornsbrød', 'no'),
    ('täysjyväleipä', 'fi'),
    ('croissant', null),
    ('wholemeal bread', 'en'),
    ('sauerteigbrot', 'de'),
    ('pain de campagne', 'fr'),
    ('volkorenbrood', 'nl'),
    ('surdejsbrød', 'da'),
    ('surdegsbröd', 'sv'),
    ('surdeigsbrød', 'no'),
    ('hapantaikinaleipä', 'fi'),
    ('bagel', null),
    ('sourdough', 'en'),
    ('baguette', 'de'),
    ('baguette', 'fr'),
    ('zuurdesem brood', 'nl'),
    ('baguette', 'da'),
    ('baguette', 'sv'),
    ('baguette', 'no'),
    ('patonki', 'fi'),
    ('baguette', 'en'),
    ('ciabatta', 'de'),
    ('ciabatta', 'fr'),
    ('stokbrood', 'nl'),
    ('ciabatta', 'da'),
    ('ciabatta', 'sv'),
    ('ciabatta', 'no'),
    ('baguette', 'fi'),
    ('ciabatta', 'en'),
    ('pita', 'de'),
    ('pita', 'fr'),
    ('baguette', 'nl'),
    ('pita', 'da'),
    ('pita', 'sv'),
    ('pita', 'no'),
    ('ciabatta', 'fi'),
    ('pita', 'en'),
    ('naan', 'de'),
    ('naan', 'fr'),
    ('ciabatta', 'nl'),
    ('naan', 'da'),
    ('naan', 'sv'),
    ('naan', 'no'),
    ('pita', 'fi'),
    ('naan', 'en'),
    ('wrap', 'de'),
    ('wrap', 'fr'),
    ('pita', 'nl'),
    ('wrap', 'da'),
    ('wrap', 'sv'),
    ('wrap', 'no'),
    ('naan', 'fi'),
    ('tortilla wrap', 'en'),
    ('brötchen', 'de'),
    ('petits pains', 'fr'),
    ('naan', 'nl'),
    ('boller', 'da'),
    ('frallor', 'sv'),
    ('rundstykker', 'no'),
    ('wrap', 'fi'),
    ('rolls', 'en'),
    ('semmeln', 'de'),
    ('brioche', 'fr'),
    ('wrap', 'nl'),
    ('rundstykker', 'da'),
    ('bullar', 'sv'),
    ('boller', 'no'),
    ('sämpylä', 'fi'),
    ('buns', 'en'),
    ('burgerbrötchen', 'de'),
    ('pain burger', 'fr')
) as v(alias, lang)
where c.slug = 'bakery'
on conflict (alias_normalized, language) do nothing;

-- frozen (240)
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('frozen peas', 'en'),
    ('tiefkühl erbsen', 'de'),
    ('petits pois surgelés', 'fr'),
    ('diepvries erwten', 'nl'),
    ('frosne ærter', 'da'),
    ('frysta ärtor', 'sv'),
    ('frosne erter', 'no'),
    ('pakastetut herneet', 'fi'),
    ('frozen', null),
    ('frozen corn', 'en'),
    ('tiefkühlerbsen', 'de'),
    ('maïs surgelé', 'fr'),
    ('diepvries maïs', 'nl'),
    ('frosne majs', 'da'),
    ('fryst majs', 'sv'),
    ('frossen mais', 'no'),
    ('pakastemaissi', 'fi'),
    ('tiefkühl', null),
    ('frozen spinach', 'en'),
    ('tiefkühl mais', 'de'),
    ('épinards surgelés', 'fr'),
    ('diepvries spinazie', 'nl'),
    ('frossen spinat', 'da'),
    ('fryst spenat', 'sv'),
    ('frossen spinat', 'no'),
    ('pakastespinatti', 'fi'),
    ('surgelé', null),
    ('frozen broccoli', 'en'),
    ('tiefkühlspinat', 'de'),
    ('brocoli surgelé', 'fr'),
    ('diepvries broccoli', 'nl'),
    ('frossen broccoli', 'da'),
    ('fryst broccoli', 'sv'),
    ('frossen brokkoli', 'no'),
    ('pakasteparsakaali', 'fi'),
    ('diepvries', null),
    ('frozen cauliflower', 'en'),
    ('tiefkühlbrokkoli', 'de'),
    ('chou-fleur surgelé', 'fr'),
    ('diepvries bloemkool', 'nl'),
    ('frossen blomkål', 'da'),
    ('fryst blomkål', 'sv'),
    ('frossen blomkål', 'no'),
    ('pakastekukkakaali', 'fi'),
    ('frost', null),
    ('frozen green beans', 'en'),
    ('tiefkühlblumenkohl', 'de'),
    ('haricots verts surgelés', 'fr'),
    ('diepvries sperziebonen', 'nl'),
    ('frosne bønner', 'da'),
    ('frysta bönor', 'sv'),
    ('frosne bønner', 'no'),
    ('pakastejuurekset', 'fi'),
    ('fryst', null),
    ('frozen mixed vegetables', 'en'),
    ('tiefkühlbohnen', 'de'),
    ('légumes surgelés', 'fr'),
    ('diepvries groenten', 'nl'),
    ('frosne grøntsager', 'da'),
    ('frysta grönsaker', 'sv'),
    ('frosne grønnsaker', 'no'),
    ('pakastemarjat', 'fi'),
    ('frossen', null),
    ('frozen carrots', 'en'),
    ('tiefkühlgemüse', 'de'),
    ('carottes surgelées', 'fr'),
    ('diepvries wortelen', 'nl'),
    ('frosne gulerødder', 'da'),
    ('frysta morötter', 'sv'),
    ('frosne gulrøtter', 'no'),
    ('pakastemansikat', 'fi'),
    ('pakaste', null),
    ('frozen berries', 'en'),
    ('tiefkühlkarotten', 'de'),
    ('fruits rouges surgelés', 'fr'),
    ('diepvries bessen', 'nl'),
    ('frosne bær', 'da'),
    ('frysta bär', 'sv'),
    ('frosne bær', 'no'),
    ('pakaste vadelmat', 'fi'),
    ('frozen strawberries', 'en'),
    ('tiefkühlbeeren', 'de'),
    ('fraises surgelées', 'fr'),
    ('diepvries aardbeien', 'nl'),
    ('frosne jordbær', 'da'),
    ('frysta jordgubbar', 'sv'),
    ('frosne jordbær', 'no'),
    ('pakaste mustikat', 'fi'),
    ('frozen raspberries', 'en'),
    ('tiefkühlerdbeeren', 'de'),
    ('framboises surgelées', 'fr'),
    ('diepvries frambozen', 'nl'),
    ('frosne hindbær', 'da'),
    ('frysta hallon', 'sv'),
    ('frosne bringebær', 'no'),
    ('pakastemango', 'fi'),
    ('frozen blueberries', 'en'),
    ('tiefkühlhimbeeren', 'de'),
    ('myrtilles surgelées', 'fr'),
    ('diepvries bosbessen', 'nl'),
    ('frosne blåbær', 'da'),
    ('frysta blåbär', 'sv'),
    ('frosne blåbær', 'no'),
    ('pakasteananas', 'fi'),
    ('frozen mango', 'en'),
    ('tiefkühlheidelbeeren', 'de'),
    ('mangue surgelée', 'fr'),
    ('diepvries mango', 'nl'),
    ('frossen mango', 'da'),
    ('fryst mango', 'sv'),
    ('frossen mango', 'no'),
    ('pakastepizza', 'fi'),
    ('frozen pineapple', 'en'),
    ('tiefkühl mango', 'de'),
    ('ananas surgelé', 'fr'),
    ('diepvries ananas', 'nl'),
    ('frossen ananas', 'da'),
    ('fryst ananas', 'sv'),
    ('frossen ananas', 'no'),
    ('pakastelasagne', 'fi'),
    ('frozen pizza', 'en'),
    ('tiefkühl ananas', 'de'),
    ('pizza surgelée', 'fr'),
    ('diepvries pizza', 'nl'),
    ('frossen pizza', 'da'),
    ('fryst pizza', 'sv'),
    ('frossen pizza', 'no'),
    ('pakasteranskalaiset', 'fi'),
    ('frozen lasagne', 'en'),
    ('tiefkühlpizza', 'de'),
    ('lasagnes surgelées', 'fr'),
    ('diepvries lasagne', 'nl'),
    ('frossen lasagne', 'da'),
    ('fryst lasagne', 'sv'),
    ('frossen lasagne', 'no'),
    ('kalapuikot', 'fi'),
    ('frozen fries', 'en'),
    ('tiefkühllasagne', 'de'),
    ('frites surgelées', 'fr'),
    ('diepvries friet', 'nl'),
    ('frosne pomfritter', 'da'),
    ('frysta pommes', 'sv'),
    ('frosne pommes frites', 'no'),
    ('kananugetit', 'fi'),
    ('frozen chips', 'en'),
    ('pommes frites tiefkühl', 'de'),
    ('batonnets de poisson', 'fr'),
    ('diepvries patat', 'nl'),
    ('fiskefrikadeller', 'da'),
    ('fiskpinnar', 'sv'),
    ('fiskepinner', 'no'),
    ('pakaste katkaravut', 'fi'),
    ('frozen fish fingers', 'en'),
    ('fischstäbchen', 'de'),
    ('nuggets de poulet', 'fr'),
    ('vissticks', 'nl'),
    ('kyllingenuggets', 'da'),
    ('kycklingnuggets', 'sv'),
    ('kyllingnuggets', 'no'),
    ('pakastelohi', 'fi'),
    ('frozen chicken nuggets', 'en'),
    ('chicken nuggets', 'de'),
    ('crevettes surgelées', 'fr'),
    ('kippenuggets', 'nl'),
    ('frosne rejer', 'da'),
    ('frysta räkor', 'sv'),
    ('frosne reker', 'no'),
    ('pakasteturska', 'fi'),
    ('frozen chicken strips', 'en'),
    ('chicken strips', 'de'),
    ('saumon surgelé', 'fr'),
    ('diepvries garnalen', 'nl'),
    ('frossen laks', 'da'),
    ('fryst lax', 'sv'),
    ('frossen laks', 'no'),
    ('pakastejauheliha', 'fi'),
    ('frozen prawns', 'en'),
    ('tiefkühlgarnelen', 'de'),
    ('cabillaud surgelé', 'fr'),
    ('diepvries zalm', 'nl'),
    ('frossen torsk', 'da'),
    ('fryst torsk', 'sv'),
    ('frossen torsk', 'no'),
    ('pakastelihapullat', 'fi'),
    ('frozen salmon', 'en'),
    ('tiefkühllachs', 'de'),
    ('viande hachée surgelée', 'fr'),
    ('diepvries kabeljauw', 'nl'),
    ('frossent hakket kød', 'da'),
    ('fryst färs', 'sv'),
    ('frossent kjøttdeig', 'no'),
    ('pakastehampurilaiset', 'fi'),
    ('frozen cod', 'en'),
    ('tiefkühlkabeljau', 'de'),
    ('boulettes surgelées', 'fr'),
    ('diepvries gehakt', 'nl'),
    ('frosne frikadeller', 'da'),
    ('frysta köttbullar', 'sv'),
    ('frosne kjøttboller', 'no'),
    ('pakastevohvelit', 'fi'),
    ('frozen haddock', 'en'),
    ('tiefkühlhackfleisch', 'de'),
    ('burgers surgelés', 'fr'),
    ('diepvries gehaktballen', 'nl'),
    ('frosne burgers', 'da'),
    ('frysta hamburgare', 'sv'),
    ('frosne burgere', 'no'),
    ('pakastepannukakut', 'fi'),
    ('frozen mince', 'en'),
    ('tiefkühl frikadellen', 'de'),
    ('gaufres surgelées', 'fr'),
    ('diepvries burgers', 'nl'),
    ('frosne vafler', 'da'),
    ('frysta våfflor', 'sv'),
    ('frosne vafler', 'no'),
    ('pakastepiirakka', 'fi'),
    ('frozen meatballs', 'en'),
    ('tiefkühl burger', 'de'),
    ('crêpes surgelées', 'fr'),
    ('diepvries wafels', 'nl'),
    ('frosne pandekager', 'da'),
    ('frysta pannkakor', 'sv'),
    ('frosne pannekaker', 'no'),
    ('pakasteruoka', 'fi'),
    ('frozen burgers', 'en'),
    ('tiefkühlwaffeln', 'de'),
    ('pâtisserie surgelée', 'fr'),
    ('diepvries pannenkoeken', 'nl'),
    ('frossen tærte', 'da'),
    ('fryst paj', 'sv'),
    ('frossen pai', 'no'),
    ('pakastikeitto', 'fi'),
    ('frozen waffles', 'en'),
    ('tiefkühlpfannkuchen', 'de'),
    ('tarte surgelée', 'fr'),
    ('diepvries deeg', 'nl'),
    ('frossen ret', 'da'),
    ('fryst färdigrätt', 'sv'),
    ('frossen ferdigrett', 'no'),
    ('jäätelö', 'fi')
) as v(alias, lang)
where c.slug = 'frozen'
on conflict (alias_normalized, language) do nothing;

-- pantry (155)
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('rice', 'en'),
    ('reis', 'de'),
    ('riz', 'fr'),
    ('rijst', 'nl'),
    ('ris', 'da'),
    ('ris', 'sv'),
    ('ris', 'no'),
    ('riisi', 'fi'),
    ('rice', null),
    ('basmati rice', 'en'),
    ('basmatireis', 'de'),
    ('riz basmati', 'fr'),
    ('basmatirijst', 'nl'),
    ('basmatiris', 'da'),
    ('basmatiris', 'sv'),
    ('basmatiris', 'no'),
    ('basmatiriisi', 'fi'),
    ('pasta', null),
    ('jasmine rice', 'en'),
    ('jasminreis', 'de'),
    ('riz jasmin', 'fr'),
    ('jasmijnrijst', 'nl'),
    ('jasminris', 'da'),
    ('jasminris', 'sv'),
    ('jasminris', 'no'),
    ('jasmiiniriisi', 'fi'),
    ('flour', null),
    ('brown rice', 'en'),
    ('brauner reis', 'de'),
    ('riz complet', 'fr'),
    ('zilvervliesrijst', 'nl'),
    ('brune ris', 'da'),
    ('brunt ris', 'sv'),
    ('brun ris', 'no'),
    ('täysjyväriisi', 'fi'),
    ('sugar', null),
    ('pasta', 'en'),
    ('nudeln', 'de'),
    ('pâtes', 'fr'),
    ('pasta', 'nl'),
    ('pasta', 'da'),
    ('pasta', 'sv'),
    ('pasta', 'no'),
    ('pasta', 'fi'),
    ('salt', null),
    ('spaghetti', 'en'),
    ('spaghetti', 'de'),
    ('spaghetti', 'fr'),
    ('spaghetti', 'nl'),
    ('spaghetti', 'da'),
    ('spaghetti', 'sv'),
    ('spaghetti', 'no'),
    ('spagetti', 'fi'),
    ('oil', null),
    ('penne', 'en'),
    ('penne', 'de'),
    ('penne', 'fr'),
    ('penne', 'nl'),
    ('penne', 'da'),
    ('penne', 'sv'),
    ('penne', 'no'),
    ('penne', 'fi'),
    ('honey', null),
    ('fusilli', 'en'),
    ('fusilli', 'de'),
    ('fusilli', 'fr'),
    ('fusilli', 'nl'),
    ('fusilli', 'da'),
    ('fusilli', 'sv'),
    ('fusilli', 'no'),
    ('fusilli', 'fi'),
    ('oats', null),
    ('lasagne sheets', 'en'),
    ('lasagneplatten', 'de'),
    ('feuilles de lasagne', 'fr'),
    ('lasagnebladen', 'nl'),
    ('lasagneplader', 'da'),
    ('lasagneplattor', 'sv'),
    ('lasagneplater', 'no'),
    ('lasagnelevyt', 'fi'),
    ('quinoa', null),
    ('noodles', 'en'),
    ('mehl', 'de'),
    ('farine', 'fr'),
    ('bloem', 'nl'),
    ('mel', 'da'),
    ('mjöl', 'sv'),
    ('mel', 'no'),
    ('jauho', 'fi'),
    ('flour', 'en'),
    ('weizenmehl', 'de'),
    ('sucre', 'fr'),
    ('suiker', 'nl'),
    ('sukker', 'da'),
    ('socker', 'sv'),
    ('sukker', 'no'),
    ('sokeri', 'fi'),
    ('plain flour', 'en'),
    ('backmehl', 'de'),
    ('sucre roux', 'fr'),
    ('bruine suiker', 'nl'),
    ('brun sukker', 'da'),
    ('brunt socker', 'sv'),
    ('brunt sukker', 'no'),
    ('ruskea sokeri', 'fi'),
    ('self-raising flour', 'en'),
    ('zucker', 'de'),
    ('sucre glace', 'fr'),
    ('poedersuiker', 'nl'),
    ('flormelis', 'da'),
    ('florsocker', 'sv'),
    ('melis', 'no'),
    ('tomusokeri', 'fi'),
    ('bread flour', 'en'),
    ('brauner zucker', 'de'),
    ('sel', 'fr'),
    ('zout', 'nl'),
    ('salt', 'da'),
    ('salt', 'sv'),
    ('salt', 'no'),
    ('suola', 'fi'),
    ('sugar', 'en'),
    ('puderzucker', 'de'),
    ('poivre', 'fr'),
    ('peper', 'nl'),
    ('peber', 'da'),
    ('peppar', 'sv'),
    ('pepper', 'no'),
    ('pippuri', 'fi'),
    ('caster sugar', 'en'),
    ('salz', 'de'),
    ('huile d''olive', 'fr'),
    ('olijfolie', 'nl'),
    ('olivenolie', 'da'),
    ('olivolja', 'sv'),
    ('olivenolje', 'no'),
    ('oliiviöljy', 'fi'),
    ('brown sugar', 'en'),
    ('pfeffer', 'de'),
    ('huile de tournesol', 'fr'),
    ('zonnebloemolie', 'nl'),
    ('solsikkeolie', 'da'),
    ('solrosolja', 'sv'),
    ('solsikkeolje', 'no'),
    ('auringonkukkaöljy', 'fi'),
    ('icing sugar', 'en'),
    ('olivenöl', 'de'),
    ('huile de coco', 'fr'),
    ('kokosolie', 'nl'),
    ('kokosolie', 'da'),
    ('kokosolja', 'sv'),
    ('kokosolje', 'no'),
    ('kookosöljy', 'fi'),
    ('salt', 'en'),
    ('sonnenblumenöl', 'de')
) as v(alias, lang)
where c.slug = 'pantry'
on conflict (alias_normalized, language) do nothing;

-- beverages (115)
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('water', 'en'),
    ('wasser', 'de'),
    ('eau', 'fr'),
    ('water', 'nl'),
    ('vand', 'da'),
    ('vatten', 'sv'),
    ('vann', 'no'),
    ('vesi', 'fi'),
    ('water', null),
    ('sparkling water', 'en'),
    ('sprudelwasser', 'de'),
    ('eau pétillante', 'fr'),
    ('bruiswater', 'nl'),
    ('danskvand', 'da'),
    ('kolsyrat vatten', 'sv'),
    ('mineralvann', 'no'),
    ('hiilihapotettu vesi', 'fi'),
    ('juice', null),
    ('still water', 'en'),
    ('stilles wasser', 'de'),
    ('eau plate', 'fr'),
    ('plat water', 'nl'),
    ('stille vand', 'da'),
    ('stillavatten', 'sv'),
    ('kullsyrevann', 'no'),
    ('juomavesi', 'fi'),
    ('coffee', null),
    ('mineral water', 'en'),
    ('mineralwasser', 'de'),
    ('eau minérale', 'fr'),
    ('mineraalwater', 'nl'),
    ('mineralvand', 'da'),
    ('mineralvatten', 'sv'),
    ('stillevann', 'no'),
    ('mineraalivesi', 'fi'),
    ('tea', null),
    ('juice', 'en'),
    ('saft', 'de'),
    ('jus', 'fr'),
    ('sap', 'nl'),
    ('juice', 'da'),
    ('juice', 'sv'),
    ('juice', 'no'),
    ('mehu', 'fi'),
    ('beer', null),
    ('orange juice', 'en'),
    ('orangensaft', 'de'),
    ('jus d''orange', 'fr'),
    ('sinaasappelsap', 'nl'),
    ('appelsinjuice', 'da'),
    ('apelsinjuice', 'sv'),
    ('appelsinjuice', 'no'),
    ('appelsiinimehu', 'fi'),
    ('wine', null),
    ('apple juice', 'en'),
    ('apfelsaft', 'de'),
    ('jus de pomme', 'fr'),
    ('appelsap', 'nl'),
    ('æblejuice', 'da'),
    ('äppeljuice', 'sv'),
    ('eplejuice', 'no'),
    ('omenamehu', 'fi'),
    ('cola', null),
    ('cranberry juice', 'en'),
    ('kaffee', 'de'),
    ('café', 'fr'),
    ('koffie', 'nl'),
    ('kaffe', 'da'),
    ('kaffe', 'sv'),
    ('kaffe', 'no'),
    ('kahvi', 'fi'),
    ('coffee', 'en'),
    ('gemahlener kaffee', 'de'),
    ('café moulu', 'fr'),
    ('gemalen koffie', 'nl'),
    ('formalet kaffe', 'da'),
    ('malet kaffe', 'sv'),
    ('malt kaffe', 'no'),
    ('jauhettu kahvi', 'fi'),
    ('ground coffee', 'en'),
    ('löslicher kaffee', 'de'),
    ('café soluble', 'fr'),
    ('oploskoffie', 'nl'),
    ('instant kaffe', 'da'),
    ('snabbkaffe', 'sv'),
    ('pulverkaffe', 'no'),
    ('pikakahvi', 'fi'),
    ('instant coffee', 'en'),
    ('kaffeebohnen', 'de'),
    ('grains de café', 'fr'),
    ('koffiebonen', 'nl'),
    ('kaffebønner', 'da'),
    ('kaffebönor', 'sv'),
    ('kaffebønner', 'no'),
    ('kahvipavut', 'fi'),
    ('coffee beans', 'en'),
    ('tee', 'de'),
    ('thé', 'fr'),
    ('thee', 'nl'),
    ('te', 'da'),
    ('te', 'sv'),
    ('te', 'no'),
    ('tee', 'fi'),
    ('tea', 'en'),
    ('grüner tee', 'de'),
    ('thé vert', 'fr'),
    ('groene thee', 'nl'),
    ('grøn te', 'da'),
    ('grönt te', 'sv'),
    ('grønn te', 'no'),
    ('vihreä tee', 'fi'),
    ('green tea', 'en'),
    ('schwarzer tee', 'de'),
    ('thé noir', 'fr'),
    ('zwarte thee', 'nl')
) as v(alias, lang)
where c.slug = 'beverages'
on conflict (alias_normalized, language) do nothing;

-- snacks (240)
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('chips', 'en'),
    ('chips', 'de'),
    ('chips', 'fr'),
    ('chips', 'nl'),
    ('chips', 'da'),
    ('chips', 'sv'),
    ('chips', 'no'),
    ('sipsit', 'fi'),
    ('snack', null),
    ('crisps', 'en'),
    ('kartoffelchips', 'de'),
    ('chips de pomme de terre', 'fr'),
    ('aardappelchips', 'nl'),
    ('kartoffelchips', 'da'),
    ('potatischips', 'sv'),
    ('potetgull', 'no'),
    ('perunasipsit', 'fi'),
    ('snacks', null),
    ('potato chips', 'en'),
    ('tortilla chips', 'de'),
    ('chips tortilla', 'fr'),
    ('tortilla chips', 'nl'),
    ('tortilla chips', 'da'),
    ('tortillachips', 'sv'),
    ('tortillachips', 'no'),
    ('tortillasipsit', 'fi'),
    ('chips', null),
    ('tortilla chips', 'en'),
    ('nachos', 'de'),
    ('nachos', 'fr'),
    ('nacho''s', 'nl'),
    ('nachos', 'da'),
    ('nachos', 'sv'),
    ('nachos', 'no'),
    ('nachot', 'fi'),
    ('chocolate', null),
    ('nachos', 'en'),
    ('popcorn', 'de'),
    ('pop-corn', 'fr'),
    ('popcorn', 'nl'),
    ('popcorn', 'da'),
    ('popcorn', 'sv'),
    ('popcorn', 'no'),
    ('popcorn', 'fi'),
    ('candy', null),
    ('popcorn', 'en'),
    ('brezeln', 'de'),
    ('bretzels', 'fr'),
    ('pretzels', 'nl'),
    ('kridtler', 'da'),
    ('pretzlar', 'sv'),
    ('pretzels', 'no'),
    ('pretzelit', 'fi'),
    ('popcorn', null),
    ('pretzels', 'en'),
    ('salzbrezeln', 'de'),
    ('noix', 'fr'),
    ('noten', 'nl'),
    ('saltkringler', 'da'),
    ('kringlor', 'sv'),
    ('saltkringler', 'no'),
    ('pähkinät', 'fi'),
    ('nuts', null),
    ('nuts', 'en'),
    ('nüsse', 'de'),
    ('amandes', 'fr'),
    ('amandelen', 'nl'),
    ('nødder', 'da'),
    ('nötter', 'sv'),
    ('nøtter', 'no'),
    ('mantelit', 'fi'),
    ('almonds', 'en'),
    ('mandeln', 'de'),
    ('cacahuètes', 'fr'),
    ('pinda''s', 'nl'),
    ('mandler', 'da'),
    ('mandlar', 'sv'),
    ('mandler', 'no'),
    ('maapähkinät', 'fi'),
    ('peanuts', 'en'),
    ('erdnüsse', 'de'),
    ('noix de cajou', 'fr'),
    ('cashewnoten', 'nl'),
    ('peanuts', 'da'),
    ('jordnötter', 'sv'),
    ('peanøtter', 'no'),
    ('cashewpähkinät', 'fi'),
    ('cashews', 'en'),
    ('cashewkerne', 'de'),
    ('noix de grenoble', 'fr'),
    ('walnoten', 'nl'),
    ('cashewnødder', 'da'),
    ('cashewnötter', 'sv'),
    ('cashewnøtter', 'no'),
    ('saksanpähkinät', 'fi'),
    ('walnuts', 'en'),
    ('walnüsse', 'de'),
    ('pistaches', 'fr'),
    ('pistachenoten', 'nl'),
    ('valnødder', 'da'),
    ('valnötter', 'sv'),
    ('valnøtter', 'no'),
    ('pistaasipähkinät', 'fi'),
    ('pistachios', 'en'),
    ('pistazien', 'de'),
    ('mélange de noix', 'fr'),
    ('notenmix', 'nl'),
    ('pistacienødder', 'da'),
    ('pistagenötter', 'sv'),
    ('pistasjnøtter', 'no'),
    ('pähkinäsekoitus', 'fi'),
    ('mixed nuts', 'en'),
    ('nussmischung', 'de'),
    ('chocolat', 'fr'),
    ('chocolade', 'nl'),
    ('nøddeblanding', 'da'),
    ('nötblandning', 'sv'),
    ('nøtteblanding', 'no'),
    ('suklaa', 'fi'),
    ('trail mix', 'en'),
    ('studentenfutter', 'de'),
    ('chocolat au lait', 'fr'),
    ('melkchocolade', 'nl'),
    ('chokolade', 'da'),
    ('choklad', 'sv'),
    ('sjokolade', 'no'),
    ('maitosuklaa', 'fi'),
    ('chocolate', 'en'),
    ('schokolade', 'de'),
    ('chocolat noir', 'fr'),
    ('pure chocolade', 'nl'),
    ('mælkechokolade', 'da'),
    ('mjölkchoklad', 'sv'),
    ('melkesjokolade', 'no'),
    ('tumma suklaa', 'fi'),
    ('milk chocolate', 'en'),
    ('vollmilchschokolade', 'de'),
    ('barre chocolatée', 'fr'),
    ('chocoladereep', 'nl'),
    ('mørk chokolade', 'da'),
    ('mörk choklad', 'sv'),
    ('mørk sjokolade', 'no'),
    ('suklaapatukka', 'fi'),
    ('dark chocolate', 'en'),
    ('zartbitterschokolade', 'de'),
    ('bonbons', 'fr'),
    ('snoep', 'nl'),
    ('chokoladebar', 'da'),
    ('chokladkaka', 'sv'),
    ('sjokoladeplate', 'no'),
    ('karkit', 'fi'),
    ('white chocolate', 'en'),
    ('schokoriegel', 'de'),
    ('oursons gélifiés', 'fr'),
    ('winegums', 'nl'),
    ('slik', 'da'),
    ('godis', 'sv'),
    ('godteri', 'no'),
    ('karkkimix', 'fi'),
    ('chocolate bar', 'en'),
    ('süßigkeiten', 'de'),
    ('réglisse', 'fr'),
    ('drop', 'nl'),
    ('vingummi', 'da'),
    ('gelégodis', 'sv'),
    ('seiggodt', 'no'),
    ('lakritsi', 'fi'),
    ('candy', 'en'),
    ('gummibärchen', 'de'),
    ('sucettes', 'fr'),
    ('lolly''s', 'nl'),
    ('lakrids', 'da'),
    ('lakrits', 'sv'),
    ('lakris', 'no'),
    ('tikkukarkit', 'fi'),
    ('sweets', 'en'),
    ('lakritz', 'de'),
    ('biscuits', 'fr'),
    ('koekjes', 'nl'),
    ('slikkepinde', 'da'),
    ('sugtabletter', 'sv'),
    ('sukkerstenger', 'no'),
    ('keksit', 'fi'),
    ('gummy bears', 'en'),
    ('lutscher', 'de'),
    ('crackers', 'fr'),
    ('biscuits', 'nl'),
    ('kiks', 'da'),
    ('kex', 'sv'),
    ('kjeks', 'no'),
    ('näkkileipä', 'fi'),
    ('liquorice', 'en'),
    ('kekse', 'de'),
    ('galettes de riz', 'fr'),
    ('crackers', 'nl'),
    ('crackers', 'da'),
    ('crackers', 'sv'),
    ('crackers', 'no'),
    ('riisikakut', 'fi'),
    ('lollipops', 'en'),
    ('cracker', 'de'),
    ('barre céréales', 'fr'),
    ('rijstwafels', 'nl'),
    ('riskager', 'da'),
    ('riskakor', 'sv'),
    ('riskaker', 'no'),
    ('myslipatukka', 'fi'),
    ('cookies', 'en'),
    ('reiswaffeln', 'de'),
    ('barre protéinée', 'fr'),
    ('mueslireep', 'nl'),
    ('müslibar', 'da'),
    ('müslibar', 'sv'),
    ('müslibar', 'no'),
    ('proteiinipatukka', 'fi'),
    ('biscuits', 'en'),
    ('müsliriegel', 'de'),
    ('barre énergétique', 'fr'),
    ('proteinereep', 'nl'),
    ('proteinbar', 'da'),
    ('proteinbar', 'sv'),
    ('proteinbar', 'no'),
    ('energiapatukka', 'fi'),
    ('crackers', 'en'),
    ('proteinriegel', 'de'),
    ('jerky', 'fr'),
    ('energiereep', 'nl'),
    ('energibar', 'da'),
    ('energibar', 'sv'),
    ('energibar', 'no'),
    ('suolapähkinät', 'fi'),
    ('rice cakes', 'en'),
    ('energieriegel', 'de'),
    ('bâtonnets', 'fr'),
    ('beef jerky', 'nl'),
    ('saltede peanuts', 'da'),
    ('saltade jordnötter', 'sv'),
    ('saltede peanøtter', 'no'),
    ('hasselpähkinät', 'fi'),
    ('granola bar', 'en')
) as v(alias, lang)
where c.slug = 'snacks'
on conflict (alias_normalized, language) do nothing;

-- household (240)
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('toilet paper', 'en'),
    ('toilettenpapier', 'de'),
    ('papier toilette', 'fr'),
    ('wc papier', 'nl'),
    ('toiletpapir', 'da'),
    ('toalettpapper', 'sv'),
    ('toalettpapir', 'no'),
    ('wc paperi', 'fi'),
    ('detergent', null),
    ('kitchen roll', 'en'),
    ('küchenrolle', 'de'),
    ('essuie-tout', 'fr'),
    ('toiletpapier', 'nl'),
    ('køkkenrulle', 'da'),
    ('hushållspapper', 'sv'),
    ('kjøkkenrull', 'no'),
    ('talouspaperi', 'fi'),
    ('bleach', null),
    ('paper towels', 'en'),
    ('papiertücher', 'de'),
    ('papier essuie-tout', 'fr'),
    ('keukenrol', 'nl'),
    ('papirhåndklæder', 'da'),
    ('pappershanddukar', 'sv'),
    ('papirhåndklær', 'no'),
    ('nenäliinat', 'fi'),
    ('foil', null),
    ('tissues', 'en'),
    ('taschentücher', 'de'),
    ('mouchoirs', 'fr'),
    ('keukenpapier', 'nl'),
    ('lommetørklæder', 'da'),
    ('näsdukar', 'sv'),
    ('lommetørklær', 'no'),
    ('pesuaine', 'fi'),
    ('batteries', null),
    ('facial tissues', 'en'),
    ('waschmittel', 'de'),
    ('lessive', 'fr'),
    ('tissues', 'nl'),
    ('vaskemiddel', 'da'),
    ('tvättmedel', 'sv'),
    ('vaskemiddel', 'no'),
    ('pesujauhe', 'fi'),
    ('tissues', null),
    ('laundry detergent', 'en'),
    ('waschpulver', 'de'),
    ('lessive liquide', 'fr'),
    ('zakdoekjes', 'nl'),
    ('vaskepulver', 'da'),
    ('tvättpulver', 'sv'),
    ('vaskepulver', 'no'),
    ('huuhteluaine', 'fi'),
    ('cleaner', null),
    ('washing powder', 'en'),
    ('weichspüler', 'de'),
    ('adoucissant', 'fr'),
    ('wasmiddel', 'nl'),
    ('skyllemiddel', 'da'),
    ('sköljmedel', 'sv'),
    ('skyllemiddel', 'no'),
    ('astianpesuaine', 'fi'),
    ('washing liquid', 'en'),
    ('spülmittel', 'de'),
    ('liquide vaisselle', 'fr'),
    ('waspoeder', 'nl'),
    ('opvaskemiddel', 'da'),
    ('diskmedel', 'sv'),
    ('oppvaskmiddel', 'no'),
    ('astianpesutabletit', 'fi'),
    ('fabric softener', 'en'),
    ('geschirrspültabs', 'de'),
    ('pastilles lave-vaisselle', 'fr'),
    ('wasverzachter', 'nl'),
    ('opvasketabs', 'da'),
    ('maskindiskmedel', 'sv'),
    ('oppvasktabletter', 'no'),
    ('astianpesusuola', 'fi'),
    ('dish soap', 'en'),
    ('geschirrspülsalz', 'de'),
    ('sel lave-vaisselle', 'fr'),
    ('afwasmiddel', 'nl'),
    ('opvaskesalt', 'da'),
    ('maskindisktabletter', 'sv'),
    ('oppvaskesalt', 'no'),
    ('huuhtelukirkaste', 'fi'),
    ('washing up liquid', 'en'),
    ('klarspüler', 'de'),
    ('liquide rinçage', 'fr'),
    ('vaatwastabletten', 'nl'),
    ('afspændingsmiddel', 'da'),
    ('diskmaskinsalt', 'sv'),
    ('avspylingsmiddel', 'no'),
    ('yleispuhdistusaine', 'fi'),
    ('dishwasher tablets', 'en'),
    ('allzweckreiniger', 'de'),
    ('nettoyant multi-usages', 'fr'),
    ('vaatwaszout', 'nl'),
    ('rengøringsmiddel', 'da'),
    ('avspänningsmedel', 'sv'),
    ('rengjøringsmiddel', 'no'),
    ('kylpyhuoneen puhdistusaine', 'fi'),
    ('dishwasher salt', 'en'),
    ('badreiniger', 'de'),
    ('nettoyant salle de bain', 'fr'),
    ('glansspoelmiddel', 'nl'),
    ('badeværelsesrengøring', 'da'),
    ('allrengöringsmedel', 'sv'),
    ('baderomsrengjøring', 'no'),
    ('lasinpuhdistusaine', 'fi'),
    ('rinse aid', 'en'),
    ('glasreiniger', 'de'),
    ('nettoyant vitres', 'fr'),
    ('allesreiniger', 'nl'),
    ('glasrens', 'da'),
    ('badrumsrengöring', 'sv'),
    ('glassrens', 'no'),
    ('lattianpuhdistusaine', 'fi'),
    ('all-purpose cleaner', 'en'),
    ('bodenreiniger', 'de'),
    ('nettoyant sol', 'fr'),
    ('badkamerreiniger', 'nl'),
    ('gulvrens', 'da'),
    ('glasrengöring', 'sv'),
    ('gulvrens', 'no'),
    ('valkaisuaine', 'fi'),
    ('bathroom cleaner', 'en'),
    ('bleiche', 'de'),
    ('eau de javel', 'fr'),
    ('glasreiniger', 'nl'),
    ('bleach', 'da'),
    ('golvrengöring', 'sv'),
    ('blekemiddel', 'no'),
    ('desinfiointiaine', 'fi'),
    ('glass cleaner', 'en'),
    ('desinfektionsmittel', 'de'),
    ('désinfectant', 'fr'),
    ('vloerreiniger', 'nl'),
    ('desinfektionsmiddel', 'da'),
    ('blekmedel', 'sv'),
    ('desinfeksjonsmiddel', 'no'),
    ('siivousliinat', 'fi'),
    ('floor cleaner', 'en'),
    ('feuchttücher', 'de'),
    ('lingettes', 'fr'),
    ('bleek', 'nl'),
    ('rengøringsklude', 'da'),
    ('desinfektionsmedel', 'sv'),
    ('rengjøringskluter', 'no'),
    ('pesusienet', 'fi'),
    ('bleach', 'en'),
    ('schwämme', 'de'),
    ('éponges', 'fr'),
    ('desinfectiemiddel', 'nl'),
    ('svampe', 'da'),
    ('rengöringsdukar', 'sv'),
    ('svamper', 'no'),
    ('kumihanskat', 'fi'),
    ('disinfectant', 'en'),
    ('topfreiniger', 'de'),
    ('gants en caoutchouc', 'fr'),
    ('schoonmaakdoekjes', 'nl'),
    ('gummihandsker', 'da'),
    ('svampar', 'sv'),
    ('gummihansker', 'no'),
    ('roskapussit', 'fi'),
    ('surface wipes', 'en'),
    ('gummihandschuhe', 'de'),
    ('sacs poubelle', 'fr'),
    ('sponzen', 'nl'),
    ('affaldsposer', 'da'),
    ('gummihandskar', 'sv'),
    ('søppelposer', 'no'),
    ('pakastepussit', 'fi'),
    ('cleaning wipes', 'en'),
    ('müllbeutel', 'de'),
    ('sacs congélation', 'fr'),
    ('schuursponsjes', 'nl'),
    ('fryseposer', 'da'),
    ('soppåsar', 'sv'),
    ('fryseposer', 'no'),
    ('muovikelmu', 'fi'),
    ('sponges', 'en'),
    ('gefrierbeutel', 'de'),
    ('film alimentaire', 'fr'),
    ('rubber handschoenen', 'nl'),
    ('plastfolie', 'da'),
    ('fryspåsar', 'sv'),
    ('plastfolie', 'no'),
    ('alumiinifolio', 'fi'),
    ('scourers', 'en'),
    ('frischhaltefolie', 'de'),
    ('papier aluminium', 'fr'),
    ('vuilniszakken', 'nl'),
    ('aluminiumfolie', 'da'),
    ('plastfolie', 'sv'),
    ('aluminiumsfolie', 'no'),
    ('leivinpaperi', 'fi'),
    ('scrubbing brush', 'en'),
    ('alufolie', 'de'),
    ('papier cuisson', 'fr'),
    ('afvalzakken', 'nl'),
    ('bagepapir', 'da'),
    ('aluminiumfolie', 'sv'),
    ('bakepapir', 'no'),
    ('alumiivuoat', 'fi'),
    ('rubber gloves', 'en'),
    ('backpapier', 'de'),
    ('plaques aluminium', 'fr'),
    ('vrieszakken', 'nl'),
    ('alufoliebakker', 'da'),
    ('bakplåtspapper', 'sv'),
    ('aluminiumsformer', 'no'),
    ('paristot', 'fi'),
    ('bin bags', 'en'),
    ('aluschalen', 'de'),
    ('piles', 'fr'),
    ('vershoudfolie', 'nl'),
    ('batterier', 'da'),
    ('aluminiumformar', 'sv'),
    ('batterier', 'no'),
    ('aa paristot', 'fi'),
    ('trash bags', 'en'),
    ('batterien', 'de'),
    ('piles aa', 'fr'),
    ('aluminiumfolie', 'nl'),
    ('aa batterier', 'da'),
    ('batterier', 'sv'),
    ('aa batterier', 'no'),
    ('aaa paristot', 'fi'),
    ('food bags', 'en'),
    ('aa batterien', 'de'),
    ('piles aaa', 'fr'),
    ('bakpapier', 'nl'),
    ('aaa batterier', 'da'),
    ('aa batterier', 'sv'),
    ('aaa batterier', 'no'),
    ('lamput', 'fi'),
    ('freezer bags', 'en'),
    ('aaa batterien', 'de')
) as v(alias, lang)
where c.slug = 'household'
on conflict (alias_normalized, language) do nothing;

-- general (25)
insert into public.category_aliases (alias_normalized, category_id, language)
select v.alias, c.id, v.lang
from public.categories c
cross join (
  values
    ('miscellaneous', 'en'),
    ('sonstiges', 'de'),
    ('divers', 'fr'),
    ('overig', 'nl'),
    ('diverse', 'da'),
    ('övrigt', 'sv'),
    ('diverse', 'no'),
    ('muu', 'fi'),
    ('misc', null),
    ('other', 'en'),
    ('verschiedenes', 'de'),
    ('autre', 'fr'),
    ('diversen', 'nl'),
    ('andet', 'da'),
    ('diverse', 'sv'),
    ('annet', 'no'),
    ('sekalaista', 'fi'),
    ('other', null),
    ('various', 'en'),
    ('diverses', 'de'),
    ('autres', 'fr'),
    ('divers', 'nl'),
    ('øvrigt', 'da'),
    ('annat', 'sv'),
    ('øvrig', 'no')
) as v(alias, lang)
where c.slug = 'general'
on conflict (alias_normalized, language) do nothing;



-- --- 20260602100000_security_hardening.sql ---
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


-- --- 20260721100000_recipe_images.sql ---
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


-- --- 20260721110000_recipe_timing.sql ---
-- Recipe timing: optional prep and cook times in minutes

alter table public.recipes
  add column if not exists prep_minutes int check (prep_minutes is null or prep_minutes > 0),
  add column if not exists cook_minutes int check (cook_minutes is null or cook_minutes > 0);


-- --- 20260730120000_recipe_source_url.sql ---
-- Optional source URL for recipes imported from the web
alter table public.recipes
  add column if not exists source_url text;

