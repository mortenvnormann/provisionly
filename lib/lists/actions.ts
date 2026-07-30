"use server";

import { revalidatePath } from "next/cache";
import { getVerifiedUser } from "@/lib/auth/get-user";
import { MIGRATION_ERROR_CODES } from "@/lib/errors/migration-codes";
import type { GuestList } from "@/lib/guest/types";
import {
  parseGuestLists,
  parseItemId,
  parseListId,
  parseListItemInput,
  parseListItemUpdate,
  parseListTitle,
} from "@/lib/validation/parse";
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
  updateListItemForUser,
} from "@/lib/lists/server";
import { fetchListPageData, type ListPageData } from "@/lib/lists/fetch-list-page";
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
  const list = await createListForUser(user.id, parseListTitle(title));
  revalidatePath("/home");
  return list;
}

export async function fetchListTitleAction(
  listId: string,
): Promise<string | null> {
  const user = await getVerifiedUser();
  return fetchListTitleForUser(user.id, parseListId(listId));
}

export async function fetchListItemsAction(
  listId: string,
): Promise<ListItemRow[]> {
  const user = await getVerifiedUser();
  return fetchListItemsForUser(user.id, parseListId(listId));
}

export async function fetchListSettingsAction(
  listId: string,
): Promise<{ groupByCategory: boolean }> {
  const user = await getVerifiedUser();
  return fetchListSettingsForUser(user.id, parseListId(listId));
}

export async function fetchListSyncAction(listId: string): Promise<{
  items: ListItemRow[];
  groupByCategory: boolean;
  title: string;
  members: import("@/lib/share/types").ListMemberRow[];
}> {
  const user = await getVerifiedUser();
  return fetchListSyncForUser(user.id, parseListId(listId));
}

export async function fetchListPageAction(
  listId: string,
): Promise<ListPageData | null> {
  const user = await getVerifiedUser();
  return fetchListPageData(user.id, parseListId(listId));
}

export async function setListGroupByCategoryAction(
  listId: string,
  groupByCategory: boolean,
): Promise<void> {
  const user = await getVerifiedUser();
  await setListGroupByCategoryForUser(
    user.id,
    parseListId(listId),
    groupByCategory,
  );
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
  const item = await addListItemForUser(
    user.id,
    parseListId(listId),
    parseListItemInput(input),
  );
  revalidatePath(`/lists/${listId}`);
  return item;
}

export async function updateListItemAction(
  itemId: string,
  listId: string,
  input: {
    name: string;
    quantity?: number | null;
    unit?: string | null;
  },
): Promise<ListItemRow> {
  const user = await getVerifiedUser();
  const item = await updateListItemForUser(
    user.id,
    parseItemId(itemId),
    parseListItemUpdate(input),
  );
  revalidatePath(`/lists/${listId}`);
  return item;
}

export async function setItemCheckedAction(
  itemId: string,
  checked: boolean,
  listId: string,
): Promise<void> {
  const user = await getVerifiedUser();
  await setItemCheckedForUser(
    user.id,
    parseItemId(itemId),
    checked,
    parseListId(listId),
  );
}

export async function deleteCheckedItemsAction(
  listId: string,
): Promise<void> {
  const user = await getVerifiedUser();
  await deleteCheckedItemsForUser(user.id, parseListId(listId));
  revalidatePath(`/lists/${listId}`);
}

export async function deleteListAction(listId: string): Promise<void> {
  const user = await getVerifiedUser();
  await deleteListForUser(user.id, parseListId(listId));
  revalidatePath("/home");
}

export async function leaveListAction(listId: string): Promise<void> {
  const user = await getVerifiedUser();
  await leaveListForUser(user.id, parseListId(listId));
  revalidatePath("/home");
}

export async function deleteListItemAction(itemId: string): Promise<void> {
  const user = await getVerifiedUser();
  const listId = await deleteListItemForUser(user.id, parseItemId(itemId));
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

  const validatedLists = parseGuestLists(guestLists);
  if (validatedLists.length === 0) return result;

  let user;
  try {
    user = await getVerifiedUser();
  } catch {
    result.skipped = validatedLists.length;
    result.errors.push(MIGRATION_ERROR_CODES.notSignedIn);
    return result;
  }

  for (const guestList of validatedLists) {
    try {
      await createListWithItemsForUser(
        user.id,
        guestList.title,
        (guestList.items ?? []).map((item) => ({
          name: item.name,
          quantity: item.quantity ?? undefined,
          unit: item.unit ?? undefined,
          checked: item.checked,
          sortKey: item.sortKey,
          categoryId: item.categoryId ?? undefined,
        })),
        {
          groupByCategory: guestList.groupByCategory !== false,
        },
      );
      result.migrated += 1;
      result.migratedGuestIds.push(guestList.id);
    } catch (err) {
      result.skipped += 1;
      console.error(err);
      result.errors.push(
        `${MIGRATION_ERROR_CODES.failed}:${guestList.title}`,
      );
    }
  }

  if (result.migrated > 0) {
    revalidatePath("/home");
    result.lists = await fetchListSummariesForUser(user.id);
  }

  return result;
}
