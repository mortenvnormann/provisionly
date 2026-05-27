import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getCategoryCatalog,
  resolveCategoryFromCatalog,
} from "@/lib/categorisation/catalog";
import { updateGuestItem } from "@/lib/guest/storage";
import { normalizeItemName } from "@/lib/lists/normalize";
import type { ListItemRow } from "@/lib/lists/types";

/** Fix items saved without a category (or stuck on General when an alias exists). */
export async function repairListItemCategories(
  supabase: SupabaseClient,
  listId: string,
  items: ListItemRow[],
  locale: string,
  isGuest: boolean,
): Promise<ListItemRow[]> {
  let catalog;
  try {
    catalog = await getCategoryCatalog(supabase);
  } catch {
    return items;
  }

  const generalId = catalog.generalId;
  let changed = false;
  const next = [...items];

  for (let i = 0; i < next.length; i++) {
    const item = next[i];
    const resolved = resolveCategoryFromCatalog(catalog, item.name, locale);
    const needsRepair =
      item.categoryId == null ||
      (item.categoryId === generalId &&
        resolved !== generalId &&
        catalog.aliases.some(
          (a) => a.alias_normalized === normalizeItemName(item.name),
        ));

    if (!needsRepair || resolved === item.categoryId) continue;

    if (isGuest) {
      updateGuestItem(listId, item.id, { categoryId: resolved });
    } else {
      await supabase
        .from("list_items")
        .update({ category_id: resolved })
        .eq("id", item.id);
    }

    next[i] = { ...item, categoryId: resolved };
    changed = true;
  }

  return changed ? next : items;
}
