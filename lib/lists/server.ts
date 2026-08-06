import "server-only";

import {
  applyAiCategoryUpgrade,
  resolveCategoryForWrite,
} from "@/lib/categorisation/resolve";
import { upgradeCategoryAfterWrite } from "@/lib/categorisation/upgrade-after-write";
import { getLocaleForUser } from "@/lib/i18n/user-locale";
import { normalizeItemName, nextSortKey } from "@/lib/lists/normalize";
import type { ListItemRow, ListSettings, ListSummary } from "@/lib/lists/types";
import type { ListMemberRow } from "@/lib/share/types";
import { assertListAccess } from "@/lib/lists/access";
export { assertListAccess };
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/utils/supabase/server";
import { after } from "next/server";
import { cookies } from "next/headers";

type MemberQueryRow = {
  user_id: string;
  role: string;
  profiles:
    | { display_name: string | null }
    | { display_name: string | null }[]
    | null;
};

function displayNameFromProfiles(
  profiles: MemberQueryRow["profiles"],
): string {
  if (!profiles) return "Member";
  if (Array.isArray(profiles)) {
    return profiles[0]?.display_name ?? "Member";
  }
  return profiles.display_name ?? "Member";
}

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

export async function updateListTitleForUser(
  userId: string,
  listId: string,
  title: string,
): Promise<string> {
  await assertListAccess(userId, listId);
  const nextTitle = title.trim() || "Shopping list";
  const service = createServiceClient();
  const { data, error } = await service
    .from("lists")
    .update({ title: nextTitle })
    .eq("id", listId)
    .select("title")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not update list title");
  }
  return data.title;
}

export async function fetchListSyncForUser(
  userId: string,
  listId: string,
): Promise<{
  items: ListItemRow[];
  groupByCategory: boolean;
  title: string;
  members: ListMemberRow[];
}> {
  await assertListAccess(userId, listId);
  const service = createServiceClient();

  const [{ data: itemRows, error: itemsError }, listResult, membersResult] =
    await Promise.all([
      service
        .from("list_items")
        .select(
          "id, list_id, name_original, quantity, unit, category_id, checked, sort_key",
        )
        .eq("list_id", listId)
        .order("sort_key"),
      service
        .from("lists")
        .select("title, group_by_category, owner_id")
        .eq("id", listId)
        .single(),
      service
        .from("list_members")
        .select("user_id, role, profiles(display_name)")
        .eq("list_id", listId),
    ]);

  if (itemsError) throw new Error(itemsError.message);
  if (listResult.error) throw new Error(listResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);

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
    members: ((membersResult.data ?? []) as MemberQueryRow[])
      .map((member) => ({
        userId: member.user_id,
        displayName: displayNameFromProfiles(member.profiles),
        role: member.role,
        isOwner: member.user_id === listResult.data.owner_id,
      }))
      .sort((a, b) => {
        if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
        return a.displayName.localeCompare(b.displayName);
      }),
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

function mapListItemRow(data: {
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
  const nameNormalized = normalizeItemName(name);
  const cookieStore = await cookies();
  const userClient = createClient(cookieStore);
  const locale = await getLocaleForUser(userId);
  const { categoryId, needsAi, generalId } = await resolveCategoryForWrite(
    userClient,
    name,
    locale,
  );

  const service = createServiceClient();
  const { data, error } = await service
    .from("list_items")
    .insert({
      list_id: listId,
      name_original: name,
      name_normalized: nameNormalized,
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

  if (needsAi) {
    after(() =>
      upgradeCategoryAfterWrite({
        itemName: name,
        locale,
        itemId: data.id,
        generalId,
        nameNormalized,
      }),
    );
  }

  return mapListItemRow(data);
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
  const nameNormalized = normalizeItemName(name);
  const cookieStore = await cookies();
  const userClient = createClient(cookieStore);
  const locale = await getLocaleForUser(userId);
  const { categoryId, needsAi, generalId } = await resolveCategoryForWrite(
    userClient,
    name,
    locale,
  );

  const { data, error } = await service
    .from("list_items")
    .update({
      name_original: name,
      name_normalized: nameNormalized,
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

  if (needsAi) {
    after(() =>
      upgradeCategoryAfterWrite({
        itemName: name,
        locale,
        itemId: data.id,
        generalId,
        nameNormalized,
      }),
    );
  }

  return mapListItemRow(data);
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

export async function setAllListItemsCheckedForUser(
  userId: string,
  listId: string,
  checked: boolean,
): Promise<void> {
  await assertListAccess(userId, listId);
  const service = createServiceClient();

  const { error } = await service
    .from("list_items")
    .update({ checked })
    .eq("list_id", listId);

  if (error) throw new Error(error.message);
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
  const resolved = await Promise.all(
    items.map(async (item) => {
      if (item.categoryId) {
        return { categoryId: item.categoryId, needsAi: false as const };
      }
      return resolveCategoryForWrite(userClient, item.name, locale);
    }),
  );

  const rows = items.map((item, index) => ({
    list_id: list.id,
    name_original: item.name,
    name_normalized: normalizeItemName(item.name),
    quantity: item.quantity ?? null,
    unit: item.unit ?? null,
    category_id: resolved[index].categoryId,
    checked: item.checked ?? false,
    sort_key: item.sortKey ?? `a${index}`,
  }));

  const { data: inserted, error } = await service
    .from("list_items")
    .insert(rows)
    .select("id, name_original, category_id");
  if (error) throw new Error(error.message);

  const upgrades = (inserted ?? [])
    .map((row, index) => ({ row, needsAi: resolved[index]?.needsAi === true }))
    .filter((entry) => entry.needsAi);

  await Promise.all(
    upgrades.map(async ({ row }) => {
      const upgraded = await applyAiCategoryUpgrade(
        userClient,
        row.name_original,
        locale,
      );
      if (!upgraded || upgraded === row.category_id) return;
      await service
        .from("list_items")
        .update({ category_id: upgraded })
        .eq("id", row.id);
    }),
  );
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
