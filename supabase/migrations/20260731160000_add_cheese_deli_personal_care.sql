-- Add Cheese & deli + Personal care categories; reassign aliases and open rows.

insert into public.categories (slug, sort_order, color, labels) values
  (
    'cheese_deli',
    25,
    '#FCD34D',
    '{"en":"Cheese & deli","de":"Käse & Aufschnitt","fr":"Fromage & charcuterie","nl":"Kaas & beleg","da":"Ost og pålæg","sv":"Ost & pålägg","no":"Ost og pålegg","fi":"Juusto & leikkeleet"}'::jsonb
  ),
  (
    'personal_care',
    95,
    '#F9A8D4',
    '{"en":"Personal care","de":"Körperpflege","fr":"Hygiène & beauté","nl":"Persoonlijke verzorging","da":"Personlig pleje","sv":"Personlig vård","no":"Personlig pleie","fi":"Henkilökohtainen hygienia"}'::jsonb
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Reassign cheese / deli aliases from dairy + meat_fish
-- ---------------------------------------------------------------------------
update public.category_aliases
set category_id = (select id from public.categories where slug = 'cheese_deli')
where alias_normalized in (
  -- cheese (generic + languages)
  'cheese', 'ost', 'kaas', 'käse', 'fromage', 'juusto',
  'cheddar', 'mozzarella', 'mozarella', 'parmesan', 'feta', 'brie', 'camembert',
  'havarti', 'danbo', 'rygeost', 'flødeost', 'hytteost', 'ricotta', 'philadelphia',
  'cottage cheese', 'cream cheese', 'fromage frais', 'roomkaas', 'färskost', 'kremost',
  'tuorejuusto', 'frischkäse', 'hüttenkäse', 'ziegenkäse', 'fetaost',
  -- cold cuts / pålæg
  'bacon', 'skinke', 'ham', 'salami', 'pølse', 'pølser', 'pålæg', 'pålegg',
  'leverpostej', 'paté', 'pate', 'roastbeef', 'kalkunpåæg', 'deli meat', 'cold cuts',
  'cold cut', 'charcuterie', 'aufschnitt', 'beleg', 'leikkeleet'
);

-- New / missing cheese & deli aliases
insert into public.category_aliases (alias_normalized, category_id, language)
values
  ('pålæg', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('pålegg', (select id from public.categories where slug = 'cheese_deli'), 'no'),
  ('pålägg', (select id from public.categories where slug = 'cheese_deli'), 'sv'),
  ('roastbeef', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('roast beef', (select id from public.categories where slug = 'cheese_deli'), 'en'),
  ('kalkunpåæg', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('deli meat', (select id from public.categories where slug = 'cheese_deli'), 'en'),
  ('cold cuts', (select id from public.categories where slug = 'cheese_deli'), 'en'),
  ('cold cut', (select id from public.categories where slug = 'cheese_deli'), 'en'),
  ('charcuterie', (select id from public.categories where slug = 'cheese_deli'), 'en'),
  ('aufschnitt', (select id from public.categories where slug = 'cheese_deli'), 'de'),
  ('beleg', (select id from public.categories where slug = 'cheese_deli'), 'nl'),
  ('leikkeleet', (select id from public.categories where slug = 'cheese_deli'), 'fi'),
  ('havarti', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('danbo', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('rygeost', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('hytteost', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('brie', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('camembert', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('philadelphia', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('ricotta', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('mozarella', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('pate', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('paté', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('leverpostej', (select id from public.categories where slug = 'cheese_deli'), 'da'),
  ('ham', (select id from public.categories where slug = 'cheese_deli'), 'en'),
  ('salami', (select id from public.categories where slug = 'cheese_deli'), 'en'),
  ('salami', (select id from public.categories where slug = 'cheese_deli'), 'da')
on conflict (alias_normalized, language) do nothing;

-- ---------------------------------------------------------------------------
-- Reassign personal care aliases from household
-- ---------------------------------------------------------------------------
update public.category_aliases
set category_id = (select id from public.categories where slug = 'personal_care')
where alias_normalized in (
  'tandpasta', 'tandbørste', 'shampoo', 'balsam', 'sæbe', 'håndsæbe', 'deodorant',
  'barberskum', 'bind', 'tamponer', 'bleer', 'vådservietter',
  'toothpaste', 'toothbrush', 'conditioner', 'soap', 'hand soap', 'body wash',
  'shaving foam', 'shaving cream', 'pads', 'sanitary pads', 'tampons', 'diapers',
  'nappies', 'wet wipes', 'mouthwash', 'floss', 'razor', 'razors', 'lotion',
  'body lotion', 'sunscreen', 'facial cleanser', 'makeup remover'
);

insert into public.category_aliases (alias_normalized, category_id, language)
values
  ('toothpaste', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('toothbrush', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('shampoo', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('conditioner', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('soap', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('hand soap', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('body wash', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('deodorant', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('shaving foam', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('shaving cream', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('pads', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('sanitary pads', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('tampons', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('diapers', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('nappies', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('wet wipes', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('mouthwash', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('floss', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('razor', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('razors', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('lotion', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('body lotion', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('sunscreen', (select id from public.categories where slug = 'personal_care'), 'en'),
  ('tandkräm', (select id from public.categories where slug = 'personal_care'), 'sv'),
  ('tandkräm', (select id from public.categories where slug = 'personal_care'), 'no'),
  ('schampo', (select id from public.categories where slug = 'personal_care'), 'sv'),
  ('sjampoo', (select id from public.categories where slug = 'personal_care'), 'no'),
  ('såpe', (select id from public.categories where slug = 'personal_care'), 'no'),
  ('tvål', (select id from public.categories where slug = 'personal_care'), 'sv')
on conflict (alias_normalized, language) do nothing;

-- ---------------------------------------------------------------------------
-- Re-point existing list items + recipe ingredients that match moved aliases
-- ---------------------------------------------------------------------------
with preferred_alias as (
  select distinct on (alias_normalized)
    alias_normalized,
    category_id
  from public.category_aliases
  where category_id in (
    select id from public.categories where slug in ('cheese_deli', 'personal_care')
  )
  order by
    alias_normalized,
    case language
      when 'da' then 0
      when 'en' then 1
      else 2
    end
    nulls last
)
update public.list_items li
set category_id = pa.category_id
from preferred_alias pa
where pa.alias_normalized = li.name_normalized
  and (li.category_id is distinct from pa.category_id);

with preferred_alias as (
  select distinct on (alias_normalized)
    alias_normalized,
    category_id
  from public.category_aliases
  where category_id in (
    select id from public.categories where slug in ('cheese_deli', 'personal_care')
  )
  order by
    alias_normalized,
    case language
      when 'da' then 0
      when 'en' then 1
      else 2
    end
    nulls last
)
update public.recipe_ingredients ri
set category_id = pa.category_id
from preferred_alias pa
where pa.alias_normalized = ri.name_normalized
  and (ri.category_id is distinct from pa.category_id);
