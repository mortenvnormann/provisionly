import { GUEST_LISTS_KEY } from "@/lib/guest/constants";
import type { GuestList, GuestListItem } from "@/lib/guest/types";
import { normalizeItemName, nextSortKey } from "@/lib/lists/normalize";

function readAll(): GuestList[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_LISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestList[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(lists: GuestList[]) {
  localStorage.setItem(GUEST_LISTS_KEY, JSON.stringify(lists));
}

export function getGuestLists(): GuestList[] {
  return readAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getGuestList(id: string): GuestList | null {
  return readAll().find((list) => list.id === id) ?? null;
}

export function createGuestList(title: string): GuestList {
  const list: GuestList = {
    id: crypto.randomUUID(),
    title: title.trim() || "Shopping list",
    items: [],
    updatedAt: new Date().toISOString(),
    groupByCategory: true,
  };
  const lists = readAll();
  lists.push(list);
  writeAll(lists);
  return list;
}

export function updateGuestList(
  id: string,
  updater: (list: GuestList) => GuestList,
): GuestList | null {
  const lists = readAll();
  const index = lists.findIndex((l) => l.id === id);
  if (index === -1) return null;
  lists[index] = updater(lists[index]);
  lists[index].updatedAt = new Date().toISOString();
  writeAll(lists);
  return lists[index];
}

export function renameGuestList(listId: string, title: string): GuestList | null {
  const nextTitle = title.trim() || "Shopping list";
  return updateGuestList(listId, (list) => ({ ...list, title: nextTitle }));
}

export function addGuestItem(
  listId: string,
  item: Omit<GuestListItem, "id"> & { id?: string },
): GuestListItem | null {
  let created: GuestListItem | null = null;
  updateGuestList(listId, (list) => {
    const sortKeys = list.items.map((i) => i.sortKey ?? "a0");
    const newItem: GuestListItem = {
      id: item.id ?? crypto.randomUUID(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      checked: item.checked ?? false,
      categoryId: item.categoryId,
      sortKey: nextSortKey(sortKeys),
    };
    created = newItem;
    return { ...list, items: [...list.items, newItem] };
  });
  return created;
}

export function updateGuestItem(
  listId: string,
  itemId: string,
  patch: Partial<GuestListItem>,
): void {
  updateGuestList(listId, (list) => ({
    ...list,
    items: list.items.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item,
    ),
  }));
}

export function removeGuestItems(listId: string, itemIds: string[]): void {
  updateGuestList(listId, (list) => ({
    ...list,
    items: list.items.filter((item) => !itemIds.includes(item.id)),
  }));
}

export function clearCheckedGuestItems(listId: string): void {
  updateGuestList(listId, (list) => ({
    ...list,
    items: list.items.filter((item) => !item.checked),
  }));
}

export function setAllGuestItemsChecked(listId: string, checked: boolean): void {
  updateGuestList(listId, (list) => ({
    ...list,
    items: list.items.map((item) => ({ ...item, checked })),
  }));
}

export function deleteGuestList(id: string): void {
  writeAll(readAll().filter((list) => list.id !== id));
}

export function deleteGuestItem(listId: string, itemId: string): void {
  removeGuestItems(listId, [itemId]);
}

export { normalizeItemName };
