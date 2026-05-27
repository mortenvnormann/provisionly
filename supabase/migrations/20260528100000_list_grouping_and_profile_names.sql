-- Per-list category grouping + profile first/last name

alter table public.lists
  add column if not exists group_by_category boolean not null default true;

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;
