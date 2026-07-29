import type { ListItemRow } from "@/lib/lists/types";

const CACHE_PREFIX = "provisionly_list_cache_";
const LEGACY_SESSION_PREFIX = CACHE_PREFIX;

export type CachedList = {
  title: string;
  items: ListItemRow[];
  groupByCategory?: boolean;
  cachedAt: number;
};

function cacheKey(listId: string): string {
  return `${CACHE_PREFIX}${listId}`;
}

function readLegacySessionCache(listId: string): CachedList | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${LEGACY_SESSION_PREFIX}${listId}`);
    if (!raw) return null;
    return JSON.parse(raw) as CachedList;
  } catch {
    return null;
  }
}

function migrateSessionCacheToLocal(listId: string): CachedList | null {
  const legacy = readLegacySessionCache(listId);
  if (!legacy) return null;
  writeListCache(
    listId,
    legacy.title,
    legacy.items,
    legacy.groupByCategory,
  );
  try {
    sessionStorage.removeItem(`${LEGACY_SESSION_PREFIX}${listId}`);
  } catch {
    // Ignore
  }
  return legacy;
}

export function readListCache(listId: string): CachedList | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(listId));
    if (raw) return JSON.parse(raw) as CachedList;
  } catch {
    return null;
  }
  return migrateSessionCacheToLocal(listId);
}

export function writeListCache(
  listId: string,
  title: string,
  items: ListItemRow[],
  groupByCategory?: boolean,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const payload: CachedList = {
      title,
      items,
      groupByCategory,
      cachedAt: Date.now(),
    };
    localStorage.setItem(cacheKey(listId), JSON.stringify(payload));
  } catch {
    // Ignore quota errors
  }
}

export function itemsFingerprint(items: ListItemRow[]): string {
  return [...items]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (item) =>
        `${item.id}:${item.checked}:${item.name}:${item.quantity}:${item.unit}`,
    )
    .join("|");
}
