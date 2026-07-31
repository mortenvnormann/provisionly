-- Add pointed-cabbage aliases missed by the da/en Nordic expansion.
insert into public.category_aliases (alias_normalized, category_id, language)
values
  ('spidskål', (select id from public.categories where slug = 'produce'), 'da'),
  ('spisskål', (select id from public.categories where slug = 'produce'), 'no'),
  ('pointed cabbage', (select id from public.categories where slug = 'produce'), 'en'),
  ('sweetheart cabbage', (select id from public.categories where slug = 'produce'), 'en')
on conflict (alias_normalized, language) do nothing;
