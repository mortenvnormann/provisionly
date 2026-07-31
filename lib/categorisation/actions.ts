"use server";

import { getVerifiedUser } from "@/lib/auth/get-user";
import { resolveCategoryId } from "@/lib/categorisation/resolve";
import {
  getCategoryCatalog,
  resolveCategoryFromCatalog,
} from "@/lib/categorisation/catalog";
import { normalizeForCategoryMatch } from "@/lib/lists/normalize";
import { repairListItemCategoriesForUser } from "@/lib/lists/repair-categories-server";
import type { ListItemRow } from "@/lib/lists/types";
import { parseListId } from "@/lib/validation/parse";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function resolveCategoryIdAction(
  name: string,
  locale = "en",
): Promise<string> {
  const supabase = createClient(await cookies());
  return resolveCategoryId(supabase, name, locale);
}

/** Suggest category repairs without persisting (guest lists). */
export async function suggestItemCategoryRepairsAction(
  items: ListItemRow[],
  locale = "en",
): Promise<ListItemRow[]> {
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
          (alias) => alias.matchKey === normalizeForCategoryMatch(item.name),
        ));

    if (!needsRepair || resolved === item.categoryId) continue;

    next[i] = { ...item, categoryId: resolved };
    changed = true;
  }

  return changed ? next : items;
}

/** Repair and persist category assignments for an authenticated list. */
export async function repairListItemCategoriesAction(
  listId: string,
  items: ListItemRow[],
  locale = "en",
): Promise<ListItemRow[]> {
  const user = await getVerifiedUser();
  return repairListItemCategoriesForUser(
    user.id,
    parseListId(listId),
    items,
    locale,
  );
}
