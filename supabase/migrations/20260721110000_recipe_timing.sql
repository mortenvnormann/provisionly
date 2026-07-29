-- Recipe timing: optional prep and cook times in minutes

alter table public.recipes
  add column if not exists prep_minutes int check (prep_minutes is null or prep_minutes > 0),
  add column if not exists cook_minutes int check (cook_minutes is null or cook_minutes > 0);
