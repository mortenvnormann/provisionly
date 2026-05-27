"use server";

import { revalidatePath } from "next/cache";
import { getVerifiedUser } from "@/lib/auth/get-user";
import type { GuestList } from "@/lib/guest/types";
import {
  addListItemForUser,
  createListForUser,
  createListWithItemsForUser,
  deleteCheckedItemsForUser,
  deleteListForUser,
  deleteListItemForUser,
  fetchListItemsForUser,
  fetchListSettingsForUser,
  fetchListSummariesForUser,
  fetchListSyncForUser,
  fetchListTitleForUser,
  leaveListForUser,
  setItemCheckedForUser,
  setListGroupByCategoryForUser,
} from "@/lib/lists/server";
import type { ListItemRow, ListSummary } from "@/lib/lists/types";

export type GuestMigrationResult = {
  migrated: number;
  skipped: number;
  errors: string[];
  migratedGuestIds: string[];
  lists: ListSummary[];
};

export async function fetchListsAction(): Promise<ListSummary[]> {
  const user = await getVerifiedUser();
  return fetchListSummariesForUser(user.id);
}

export async function createListAction(title: string): Promise<ListSummary> {
  const user = await getVerifiedUser();
  const list = await createListForUser(user.id, title);
  revalidatePath("/home");
  return list;
}

export async function fetchListTitleAction(
  listId: string,
): Promise<string | null> {
  const user = await getVerifiedUser();
  return fetchListTitleForUser(user.id, listId);
}

export async function fetchListItemsAction(
  listId: string,
): Promise<ListItemRow[]> {
  const user = await getVerifiedUser();
  return fetchListItemsForUser(user.id, listId);
}

export async function fetchListSettingsAction(
  listId: string,
): Promise<{ groupByCategory: boolean }> {
  const user = await getVerifiedUser();
  return fetchListSettingsForUser(user.id, listId);
}

export async function fetchListSyncAction(listId: string): Promise<{
  items: ListItemRow[];
  groupByCategory: boolean;
}> {
  const user = await getVerifiedUser();
  return fetchListSyncForUser(user.id, listId);
}

export async function setListGroupByCategoryAction(
  listId: string,
  groupByCategory: boolean,
): Promise<void> {
  const user = await getVerifiedUser();
  await setListGroupByCategoryForUser(user.id, listId, groupByCategory);
  revalidatePath(`/lists/${listId}`);
}

export async function addListItemAction(
  listId: string,
  input: {
    name: string;
    quantity?: number | null;
    unit?: string | null;
    existingSortKeys: string[];
  },
): Promise<ListItemRow> {
  const user = await getVerifiedUser();
  const item = await addListItemForUser(user.id, listId, input);
  revalidatePath(`/lists/${listId}`);
  return item;
}

export async function setItemCheckedAction(
  itemId: string,
  checked: boolean,
  listId: string,
): Promise<void> {
  const user = await getVerifiedUser();
  await setItemCheckedForUser(user.id, itemId, checked);
  revalidatePath(`/lists/${listId}`);
}

export async function deleteCheckedItemsAction(
  listId: string,
): Promise<void> {
  const user = await getVerifiedUser();
  await deleteCheckedItemsForUser(user.id, listId);
  revalidatePath(`/lists/${listId}`);
}

export async function deleteListAction(listId: string): Promise<void> {
  const user = await getVerifiedUser();
  await deleteListForUser(user.id, listId);
  revalidatePath("/home");
}

export async function leaveListAction(listId: string): Promise<void> {
  const user = await getVerifiedUser();
  await leaveListForUser(user.id, listId);
  revalidatePath("/home");
}

export async function deleteListItemAction(itemId: string): Promise<void> {
  const user = await getVerifiedUser();
  const listId = await deleteListItemForUser(user.id, itemId);
  revalidatePath(`/lists/${listId}`);
}

export async function migrateGuestListsAction(
  guestLists: GuestList[],
): Promise<GuestMigrationResult> {
  const result: GuestMigrationResult = {
    migrated: 0,
    skipped: 0,
    errors: [],
    migratedGuestIds: [],
    lists: [],
  };

  if (guestLists.length === 0) return result;

  let user;
  try {
    user = await getVerifiedUser();
  } catch {
    result.skipped = guestLists.length;
    result.errors.push("Not signed in. Refresh the page to import guest lists.");
    return result;
  }

  for (const guestList of guestLists) {
    try {
      await createListWithItemsForUser(
        user.id,
        guestList.title,
        (guestList.items ?? []).map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          checked: item.checked,
          sortKey: item.sortKey,
          categoryId: item.categoryId,
        })),
        {
          groupByCategory: guestList.groupByCategory !== false,
        },
      );
      result.migrated += 1;
      result.migratedGuestIds.push(guestList.id);
    } catch (err) {
      result.skipped += 1;
      const message =
        err instanceof Error ? err.message : "Unknown migration error";
      result.errors.push(`${guestList.title}: ${message}`);
    }
  }

  if (result.migrated > 0) {
    revalidatePath("/home");
    result.lists = await fetchListSummariesForUser(user.id);
  }

  return result;
}
