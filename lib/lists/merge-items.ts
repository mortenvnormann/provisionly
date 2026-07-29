import { compareSortKeys } from "@/lib/lists/normalize";
import type { ListItemRow } from "@/lib/lists/types";

export function mergeListItemsPreservingOrder(
  local: ListItemRow[],
  server: ListItemRow[],
): ListItemRow[] {
  const serverMap = new Map(server.map((item) => [item.id, item]));
  const merged: ListItemRow[] = [];

  for (const item of local) {
    const updated = serverMap.get(item.id);
    if (updated) {
      merged.push(updated);
      serverMap.delete(item.id);
    }
  }

  const appended = [...serverMap.values()].sort((a, b) =>
    compareSortKeys(a.sortKey, b.sortKey),
  );
  return [...merged, ...appended];
}
