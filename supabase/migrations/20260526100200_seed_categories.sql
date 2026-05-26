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
