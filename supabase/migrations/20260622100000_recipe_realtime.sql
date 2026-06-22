-- Enable Supabase Realtime for collaborative recipes

alter publication supabase_realtime add table public.recipes;
alter publication supabase_realtime add table public.recipe_ingredients;
