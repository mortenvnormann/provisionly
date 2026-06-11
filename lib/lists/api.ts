import type { CategoryRow, ListItemRow } from "@/lib/lists/types";

/** Client-safe grouping helpers (no database access). */

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
