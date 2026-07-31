import "server-only";

import { resolveCategoryId } from "@/lib/categorisation/resolve";
import { getCategoryCatalog } from "@/lib/categorisation/catalog";
import { assertListAccess } from "@/lib/lists/server";
import type { ListItemRow } from "@/lib/lists/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/** Fix items saved without a category (or stuck on General when a better match exists). */
export async function repairListItemCategoriesForUser(
  userId: string,
  listId: string,
  items: ListItemRow[],
  locale: string,
): Promise<ListItemRow[]> {
  await assertListAccess(userId, listId);

  const supabase = createClient(await cookies());
  let generalId: string | null = null;
  try {
    generalId = (await getCategoryCatalog(supabase)).generalId;
  } catch {
    return items;
  }

  let changed = false;
  const next = [...items];

  for (let i = 0; i < next.length; i++) {
    const item = next[i];
    const needsRepair =
      item.categoryId == null || item.categoryId === generalId;
    if (!needsRepair) continue;

    const resolved = await resolveCategoryId(supabase, item.name, locale, {
      allowAi: true,
    }).catch(() => item.categoryId);

    if (!resolved || resolved === item.categoryId) continue;

    const { error } = await supabase
      .from("list_items")
      .update({ category_id: resolved })
      .eq("id", item.id);

    if (error) {
      console.error("Category repair failed:", error.message);
      continue;
    }

    next[i] = { ...item, categoryId: resolved };
    changed = true;
  }

  return changed ? next : items;
}
