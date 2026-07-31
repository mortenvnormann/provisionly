-- Common Danish produce aliases that often miss the dictionary and hit AI.
insert into public.category_aliases (alias_normalized, category_id, language)
values
  ('rødbede', (select id from public.categories where slug = 'produce'), 'da'),
  ('rødbeder', (select id from public.categories where slug = 'produce'), 'da'),
  ('roe', (select id from public.categories where slug = 'produce'), 'da'),
  ('beetroot', (select id from public.categories where slug = 'produce'), 'en'),
  ('beet', (select id from public.categories where slug = 'produce'), 'en'),
  ('beets', (select id from public.categories where slug = 'produce'), 'en')
on conflict (alias_normalized, language) do nothing;
