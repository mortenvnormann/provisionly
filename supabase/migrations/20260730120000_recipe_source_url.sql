-- Optional source URL for recipes imported from the web
alter table public.recipes
  add column if not exists source_url text;
