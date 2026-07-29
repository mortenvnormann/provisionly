import { fetchListPageAction } from "@/lib/lists/actions";
import type { ListPageData } from "@/lib/lists/fetch-list-page";

const cache = new Map<string, ListPageData>();
const inFlight = new Map<string, Promise<ListPageData | null>>();

export function getPrefetchedListDetail(listId: string): ListPageData | null {
  return cache.get(listId) ?? null;
}

export function hasPrefetchedListDetail(listId: string): boolean {
  return cache.has(listId);
}

export function prefetchListDetailData(
  listId: string,
): Promise<ListPageData | null> {
  const cached = cache.get(listId);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = inFlight.get(listId);
  if (pending) {
    return pending;
  }

  const promise = fetchListPageAction(listId)
    .then((data) => {
      if (data) {
        cache.set(listId, data);
      }
      return data;
    })
    .finally(() => {
      inFlight.delete(listId);
    });

  inFlight.set(listId, promise);
  return promise;
}

export function invalidatePrefetchedListDetail(listId?: string): void {
  if (listId) {
    cache.delete(listId);
    inFlight.delete(listId);
    return;
  }
  cache.clear();
  inFlight.clear();
}
