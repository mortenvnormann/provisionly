import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveCategoryId } from "@/lib/categorisation/resolve";
import { normalizeItemName, nextSortKey } from "@/lib/lists/normalize";
import type { CategoryRow, ListItemRow, ListSummary } from "@/lib/lists/types";

export async function fetchListSummaries(
  supabase: SupabaseClient,
): Promise<ListSummary[]> {
  const { data, error } = await supabase
    .from("lists")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
    isOwner: true,
  }));
}

export async function createList(
  supabase: SupabaseClient,
  userId: string,
  title: string,
): Promise<ListSummary> {
  const { data, error } = await supabase
    .from("lists")
    .insert({ title: title.trim() || "Shopping list", owner_id: userId })
    .select("id, title, updated_at")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    updatedAt: data.updated_at,
    isOwner: true,
  };
}

export async function fetchListItems(
  supabase: SupabaseClient,
  listId: string,
): Promise<ListItemRow[]> {
  const { data, error } = await supabase
    .from("list_items")
    .select(
      "id, list_id, name_original, quantity, unit, category_id, checked, sort_key",
    )
    .eq("list_id", listId)
    .order("sort_key");

  if (error) throw error;

  return (data ?? []).map(mapItemRow);
}

export async function fetchListTitle(
  supabase: SupabaseClient,
  listId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("lists")
    .select("title")
    .eq("id", listId)
    .maybeSingle();

  if (error) throw error;
  return data?.title ?? null;
}

export async function addListItem(
  supabase: SupabaseClient,
  listId: string,
  input: {
    name: string;
    quantity?: number | null;
    unit?: string | null;
    existingSortKeys: string[];
  },
): Promise<ListItemRow> {
  const name = input.name.trim();
  const categoryId = await resolveCategoryId(supabase, name).catch(() => null);

  const { data, error } = await supabase
    .from("list_items")
    .insert({
      list_id: listId,
      name_original: name,
      name_normalized: normalizeItemName(name),
      quantity: input.quantity ?? null,
      unit: input.unit?.trim() || null,
      category_id: categoryId,
      checked: false,
      sort_key: nextSortKey(input.existingSortKeys),
    })
    .select(
      "id, list_id, name_original, quantity, unit, category_id, checked, sort_key",
    )
    .single();

  if (error) throw error;
  return mapItemRow(data);
}

export async function setItemChecked(
  supabase: SupabaseClient,
  itemId: string,
  checked: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("list_items")
    .update({ checked })
    .eq("id", itemId);
  if (error) throw error;
}

export async function deleteCheckedItems(
  supabase: SupabaseClient,
  listId: string,
): Promise<void> {
  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("checked", true);
  if (error) throw error;
}

function mapItemRow(row: {
  id: string;
  list_id: string;
  name_original: string;
  quantity: number | null;
  unit: string | null;
  category_id: string | null;
  checked: boolean;
  sort_key: string;
}): ListItemRow {
  return {
    id: row.id,
    listId: row.list_id,
    name: row.name_original,
    quantity: row.quantity,
    unit: row.unit,
    categoryId: row.category_id,
    checked: row.checked,
    sortKey: row.sort_key,
  };
}

export function groupItemsByCategory(
  items: ListItemRow[],
  categories: CategoryRow[],
): { categoryId: string | null; items: ListItemRow[] }[] {
  const generalId =
    categories.find((c) => c.slug === "general")?.id ??
    categories.at(-1)?.id ??
    null;

  const buckets = new Map<string | null, ListItemRow[]>();

  for (const item of items) {
    const key = item.categoryId ?? generalId;
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  const order = new Map(
    categories.map((c) => [c.id, c.sortOrder] as const),
  );

  return [...buckets.entries()]
    .sort(([a], [b]) => {
      const oa = a ? (order.get(a) ?? 999) : 999;
      const ob = b ? (order.get(b) ?? 999) : 999;
      return oa - ob;
    })
    .map(([categoryId, grouped]) => ({ categoryId, items: grouped }));
}

/** Group by item.category_id even before the categories table has loaded in the UI. */
export function groupItemsByCategoryId(
  items: ListItemRow[],
): { categoryId: string | null; items: ListItemRow[] }[] {
  const buckets = new Map<string | null, ListItemRow[]>();
  for (const item of items) {
    const key = item.categoryId;
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }
  return [...buckets.entries()].map(([categoryId, grouped]) => ({
    categoryId,
    items: grouped,
  }));
}

// Fix groupItemsByCategory - CategoryRow has slug, need to pass full categories
