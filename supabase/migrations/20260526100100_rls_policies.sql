-- Provisionly v1: Row Level Security

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.category_aliases enable row level security;
alter table public.lists enable row level security;
alter table public.list_members enable row level security;
alter table public.list_items enable row level security;
alter table public.share_links enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_access enable row level security;
alter table public.recipe_clones enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Categories & aliases: public reference data (incl. guest PWA categorisation)
create policy "Anyone can read categories"
  on public.categories for select
  using (true);

create policy "Anyone can read category aliases"
  on public.category_aliases for select
  using (true);

-- Lists
create policy "Members can view lists"
  on public.lists for select
  to authenticated
  using (public.can_access_list(id));

create policy "Users can create lists"
  on public.lists for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Members can update lists"
  on public.lists for update
  to authenticated
  using (public.can_access_list(id))
  with check (public.can_access_list(id));

create policy "Owners can delete lists"
  on public.lists for delete
  to authenticated
  using (public.is_list_owner(id));

-- List members
create policy "Members can view list membership"
  on public.list_members for select
  to authenticated
  using (public.can_access_list(list_id));

create policy "Members can add collaborators"
  on public.list_members for insert
  to authenticated
  with check (
    public.can_access_list(list_id)
    and user_id is not null
  );

create policy "Owners can remove collaborators"
  on public.list_members for delete
  to authenticated
  using (
    public.is_list_owner(list_id)
    or user_id = auth.uid()
  );

-- List items
create policy "Members can view list items"
  on public.list_items for select
  to authenticated
  using (public.can_access_list(list_id));

create policy "Members can add list items"
  on public.list_items for insert
  to authenticated
  with check (public.can_access_list(list_id));

create policy "Members can update list items"
  on public.list_items for update
  to authenticated
  using (public.can_access_list(list_id))
  with check (public.can_access_list(list_id));

create policy "Members can delete list items"
  on public.list_items for delete
  to authenticated
  using (public.can_access_list(list_id));

-- Share links: only creator can manage; validation via RPC in app layer
create policy "Creators can view own share links"
  on public.share_links for select
  to authenticated
  using (created_by = auth.uid());

create policy "Members can create share links for accessible lists"
  on public.share_links for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      (resource_type = 'list' and public.can_access_list(resource_id))
      or (resource_type = 'recipe' and public.can_view_recipe(resource_id))
    )
  );

create policy "Creators can delete share links"
  on public.share_links for delete
  to authenticated
  using (created_by = auth.uid());

-- Recipes
create policy "Users can view accessible recipes"
  on public.recipes for select
  to authenticated
  using (public.can_view_recipe(id));

create policy "Users can create recipes"
  on public.recipes for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can update recipes"
  on public.recipes for update
  to authenticated
  using (public.is_recipe_owner(id))
  with check (public.is_recipe_owner(id));

create policy "Owners can delete recipes"
  on public.recipes for delete
  to authenticated
  using (public.is_recipe_owner(id));

-- Recipe ingredients
create policy "Users can view recipe ingredients"
  on public.recipe_ingredients for select
  to authenticated
  using (public.can_view_recipe(recipe_id));

create policy "Owners can manage recipe ingredients"
  on public.recipe_ingredients for insert
  to authenticated
  with check (public.is_recipe_owner(recipe_id));

create policy "Owners can update recipe ingredients"
  on public.recipe_ingredients for update
  to authenticated
  using (public.is_recipe_owner(recipe_id))
  with check (public.is_recipe_owner(recipe_id));

create policy "Owners can delete recipe ingredients"
  on public.recipe_ingredients for delete
  to authenticated
  using (public.is_recipe_owner(recipe_id));

-- Recipe access (granted via share flow)
create policy "Users can view own recipe access rows"
  on public.recipe_access for select
  to authenticated
  using (user_id = auth.uid() or public.is_recipe_owner(recipe_id));

create policy "Users can grant self recipe access"
  on public.recipe_access for insert
  to authenticated
  with check (user_id = auth.uid());

-- Recipe clones (audit trail)
create policy "Users can view own clone records"
  on public.recipe_clones for select
  to authenticated
  using (cloned_by = auth.uid());

create policy "Users can record recipe clones"
  on public.recipe_clones for insert
  to authenticated
  with check (cloned_by = auth.uid());
