import "server-only";

import { resolveCategoryId } from "@/lib/categorisation/resolve";
import { getLocaleForUser } from "@/lib/i18n/user-locale";
import { normalizeItemName, nextSortKey } from "@/lib/lists/normalize";
import type { ListItemRow, ListSettings, ListSummary } from "@/lib/lists/types";
import { assertListAccess } from "@/lib/lists/access";
export { assertListAccess };
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

async function userListIds(userId: string): Promise<string[]> {
  const service = createServiceClient();

  const [{ data: owned }, { data: memberships }] = await Promise.all([
    service.from("lists").select("id").eq("owner_id", userId),
    service.from("list_members").select("list_id").eq("user_id", userId),
  ]);

  const ids = new Set<string>();
  for (const row of owned ?? []) ids.add(row.id);
  for (const row of memberships ?? []) ids.add(row.list_id);
  return [...ids];
}

export async function fetchListSummariesForUser(
  userId: string,
): Promise<ListSummary[]> {
  const ids = await userListIds(userId);
  if (ids.length === 0) return [];

  const service = createServiceClient();
  const { data, error } = await service
    .from("lists")
    .select("id, title, updated_at, owner_id")
    .in("id", ids)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
    isOwner: row.owner_id === userId,
  }));
}

export async function createListForUser(
  userId: string,
  title: string,
): Promise<ListSummary> {
  const service = createServiceClient();

  const { data, error } = await service
    .from("lists")
    .insert({
      title: title.trim() || "Shopping list",
      owner_id: userId,
    })
    .select("id, title, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create list");
  }

  return {
    id: data.id,
    title: data.title,
    updatedAt: data.updated_at,
    isOwner: true,
  };
}

export async function fetchListTitleForUser(
  userId: string,
  listId: string,
): Promise<string | null> {
  await assertListAccess(userId, listId);
  const service = createServiceClient();
  const { data, error } = await service
    .from("lists")
    .select("title")
    .eq("id", listId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.title ?? null;
}

export async function fetchListSettingsForUser(
  userId: string,
  listId: string,
): Promise<ListSettings> {
  await assertListAccess(userId, listId);
  const service = createServiceClient();
  const { data, error } = await service
    .from("lists")
    .select("group_by_category")
    .eq("id", listId)
    .single();

  if (error) throw new Error(error.message);
  return { groupByCategory: data.group_by_category ?? true };
}

export async function setListGroupByCategoryForUser(
  userId: string,
  listId: string,
  groupByCategory: boolean,
): Promise<void> {
  await assertListAccess(userId, listId);
  const service = createServiceClient();
  const { error } = await service
    .from("lists")
    .update({ group_by_category: groupByCategory })
    .eq("id", listId);

  if (error) throw new Error(error.message);
}

export async function fetchListSyncForUser(
  userId: string,
  listId: string,
): Promise<{ items: ListItemRow[]; groupByCategory: boolean; title: string }> {
  await assertListAccess(userId, listId);
  const service = createServiceClient();

  const [{ data: itemRows, error: itemsError }, listResult] = await Promise.all([
    service
      .from("list_items")
      .select(
        "id, list_id, name_original, quantity, unit, category_id, checked, sort_key",
      )
      .eq("list_id", listId)
      .order("sort_key"),
    service
      .from("lists")
      .select("title, group_by_category")
      .eq("id", listId)
      .single(),
  ]);

  if (itemsError) throw new Error(itemsError.message);
  if (listResult.error) throw new Error(listResult.error.message);

  const items = (itemRows ?? []).map((row) => ({
    id: row.id,
    listId: row.list_id,
    name: row.name_original,
    quantity: row.quantity,
    unit: row.unit,
    categoryId: row.category_id,
    checked: row.checked,
    sortKey: row.sort_key,
  }));

  return {
    items,
    groupByCategory: listResult.data.group_by_category ?? true,
    title: listResult.data.title,
  };
}

export async function fetchListItemsForUser(
  userId: string,
  listId: string,
): Promise<ListItemRow[]> {
  await assertListAccess(userId, listId);
  const service = createServiceClient();

  const { data, error } = await service
    .from("list_items")
    .select(
      "id, list_id, name_original, quantity, unit, category_id, checked, sort_key",
    )
    .eq("list_id", listId)
    .order("sort_key");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    listId: row.list_id,
    name: row.name_original,
    quantity: row.quantity,
    unit: row.unit,
    categoryId: row.category_id,
    checked: row.checked,
    sortKey: row.sort_key,
  }));
}

export async function addListItemForUser(
  userId: string,
  listId: string,
  input: {
    name: string;
    quantity?: number | null;
    unit?: string | null;
    existingSortKeys: string[];
  },
): Promise<ListItemRow> {
  await assertListAccess(userId, listId);

  const name = input.name.trim();
  const cookieStore = await cookies();
  const userClient = createClient(cookieStore);
  const locale = await getLocaleForUser(userId);
  const categoryId = await resolveCategoryId(userClient, name, locale).catch(
    () => null,
  );

  const service = createServiceClient();
  const { data, error } = await service
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

  if (error || !data) {
    throw new Error(error?.message ?? "Could not add item");
  }

  return {
    id: data.id,
    listId: data.list_id,
    name: data.name_original,
    quantity: data.quantity,
    unit: data.unit,
    categoryId: data.category_id,
    checked: data.checked,
    sortKey: data.sort_key,
  };
}

export async function updateListItemForUser(
  userId: string,
  itemId: string,
  input: {
    name: string;
    quantity?: number | null;
    unit?: string | null;
  },
): Promise<ListItemRow> {
  const service = createServiceClient();
  const { data: existing, error: fetchError } = await service
    .from("list_items")
    .select(
      "id, list_id, name_original, quantity, unit, category_id, checked, sort_key",
    )
    .eq("id", itemId)
    .maybeSingle();

  if (fetchError || !existing) throw new Error("Item not found");
  await assertListAccess(userId, existing.list_id);

  const name = input.name.trim();
  const cookieStore = await cookies();
  const userClient = createClient(cookieStore);
  const locale = await getLocaleForUser(userId);
  const categoryId = await resolveCategoryId(userClient, name, locale).catch(
    () => null,
  );

  const { data, error } = await service
    .from("list_items")
    .update({
      name_original: name,
      name_normalized: normalizeItemName(name),
      quantity: input.quantity ?? null,
      unit: input.unit?.trim() || null,
      category_id: categoryId,
    })
    .eq("id", itemId)
    .select(
      "id, list_id, name_original, quantity, unit, category_id, checked, sort_key",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not update item");
  }

  return {
    id: data.id,
    listId: data.list_id,
    name: data.name_original,
    quantity: data.quantity,
    unit: data.unit,
    categoryId: data.category_id,
    checked: data.checked,
    sortKey: data.sort_key,
  };
}

export async function setItemCheckedForUser(
  userId: string,
  itemId: string,
  checked: boolean,
  listId: string,
): Promise<void> {
  await assertListAccess(userId, listId);
  const service = createServiceClient();

  const { data, error } = await service
    .from("list_items")
    .update({ checked })
    .eq("id", itemId)
    .eq("list_id", listId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Item not found");
}

export async function deleteCheckedItemsForUser(
  userId: string,
  listId: string,
): Promise<void> {
  await assertListAccess(userId, listId);
  const service = createServiceClient();

  const { error } = await service
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("checked", true);

  if (error) throw new Error(error.message);
}

export async function createListWithItemsForUser(
  userId: string,
  title: string,
  items: {
    name: string;
    quantity?: number;
    unit?: string;
    checked?: boolean;
    sortKey?: string;
    categoryId?: string;
  }[],
  options?: { groupByCategory?: boolean },
): Promise<void> {
  const list = await createListForUser(userId, title);
  if (options?.groupByCategory === false) {
    await setListGroupByCategoryForUser(userId, list.id, false);
  }
  if (items.length === 0) return;

  const cookieStore = await cookies();
  const userClient = createClient(cookieStore);
  const service = createServiceClient();

  const locale = await getLocaleForUser(userId);
  const rows = await Promise.all(
    items.map(async (item, index) => ({
      list_id: list.id,
      name_original: item.name,
      name_normalized: normalizeItemName(item.name),
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      category_id:
        item.categoryId ??
        (await resolveCategoryId(userClient, item.name, locale).catch(
          () => null,
        )),
      checked: item.checked ?? false,
      sort_key: item.sortKey ?? `a${index}`,
    })),
  );

  const { error } = await service.from("list_items").insert(rows);
  if (error) throw new Error(error.message);
}

export async function fetchListAccessForUser(
  userId: string,
  listId: string,
): Promise<{ isOwner: boolean }> {
  await assertListAccess(userId, listId);
  const service = createServiceClient();
  const { data, error } = await service
    .from("lists")
    .select("owner_id")
    .eq("id", listId)
    .single();

  if (error || !data) throw new Error("List not found");
  return { isOwner: data.owner_id === userId };
}

export async function deleteListForUser(
  userId: string,
  listId: string,
): Promise<void> {
  const { isOwner } = await fetchListAccessForUser(userId, listId);
  if (!isOwner) throw new Error("Only the owner can delete this list");

  const service = createServiceClient();
  const { error } = await service.from("lists").delete().eq("id", listId);
  if (error) throw new Error(error.message);
}

export async function leaveListForUser(
  userId: string,
  listId: string,
): Promise<void> {
  const { isOwner } = await fetchListAccessForUser(userId, listId);
  if (isOwner) throw new Error("Owners cannot leave their own list");

  const service = createServiceClient();
  const { error } = await service
    .from("list_members")
    .delete()
    .eq("list_id", listId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function deleteListItemForUser(
  userId: string,
  itemId: string,
): Promise<string> {
  const service = createServiceClient();
  const { data: item, error: fetchError } = await service
    .from("list_items")
    .select("list_id")
    .eq("id", itemId)
    .maybeSingle();

  if (fetchError || !item) throw new Error("Item not found");
  await assertListAccess(userId, item.list_id);

  const { error } = await service.from("list_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  return item.list_id;
}
