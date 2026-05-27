-- Guests (anon) can resolve categories when online; offline uses cached aliases.
grant execute on function public.resolve_category_id(text) to anon;
