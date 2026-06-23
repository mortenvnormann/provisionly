import "server-only";

import {
  getCategoryCatalog,
  resolveCategoryFromCatalog,
} from "@/lib/categorisation/catalog";
import { normalizeItemName } from "@/lib/lists/normalize";
import { assertListAccess } from "@/lib/lists/server";
import type { ListItemRow } from "@/lib/lists/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/** Fix items saved without a category (or stuck on General when an alias exists). */
export async function repairListItemCategoriesForUser(
  userId: string,
  listId: string,
  items: ListItemRow[],
  locale: string,
): Promise<ListItemRow[]> {
  await assertListAccess(userId, listId);

  const supabase = createClient(await cookies());
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
          (alias) => alias.alias_normalized === normalizeItemName(item.name),
        ));

    if (!needsRepair || resolved === item.categoryId) continue;

    const { error } = await supabase
      .from("list_items")
      .update({ category_id: resolved })
      .eq("id", item.id);

    if (error) continue;

    next[i] = { ...item, categoryId: resolved };
    changed = true;
  }

  return changed ? next : items;
}
