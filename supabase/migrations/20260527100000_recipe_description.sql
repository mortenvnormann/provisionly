-- Optional notes/comments on recipes (separate from step-by-step instructions)
alter table public.recipes
  add column if not exists description text not null default '';
