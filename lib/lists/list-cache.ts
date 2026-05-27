import type { ListItemRow } from "@/lib/lists/types";

const CACHE_PREFIX = "provisionly_list_cache_";

type CachedList = {
  title: string;
  items: ListItemRow[];
  groupByCategory?: boolean;
  cachedAt: number;
};

export function readListCache(listId: string): CachedList | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${listId}`);
    if (!raw) return null;
    return JSON.parse(raw) as CachedList;
  } catch {
    return null;
  }
}

export function writeListCache(
  listId: string,
  title: string,
  items: ListItemRow[],
  groupByCategory?: boolean,
): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const payload: CachedList = {
      title,
      items,
      groupByCategory,
      cachedAt: Date.now(),
    };
    sessionStorage.setItem(`${CACHE_PREFIX}${listId}`, JSON.stringify(payload));
  } catch {
    // Ignore quota errors
  }
}

export function itemsFingerprint(items: ListItemRow[]): string {
  return items
    .map((item) => `${item.id}:${item.checked}:${item.name}:${item.quantity}:${item.unit}`)
    .join("|");
}
