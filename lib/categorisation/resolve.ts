import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { categorizeItemWithGemini } from "@/lib/categorisation/ai-resolve";
import {
  clearCategoryCatalogCache,
  getCategoryCatalog,
  resolveCategoryFromCatalog,
} from "@/lib/categorisation/catalog";
import { normalizeItemName } from "@/lib/lists/normalize";
import { createServiceClient } from "@/lib/supabase/service";

export type ResolveCategoryOptions = {
  /** When true, call Gemini if dictionary returns General. Guests must leave this false. */
  allowAi?: boolean;
};

export type CategoryForWrite = {
  categoryId: string;
  generalId: string;
  /** True when dictionary landed on General — caller may run AI after the write. */
  needsAi: boolean;
};

export async function resolveCategoryId(
  supabase: SupabaseClient,
  itemName: string,
  locale = "en",
  options: ResolveCategoryOptions = {},
): Promise<string> {
  const allowAi = options.allowAi === true;

  try {
    const catalog = await getCategoryCatalog(supabase);
    const dictionaryId = resolveCategoryFromCatalog(catalog, itemName, locale);
    if (dictionaryId !== catalog.generalId || !allowAi) {
      return dictionaryId;
    }

    const upgraded = await applyAiCategoryUpgrade(
      supabase,
      itemName,
      locale,
      catalog,
    );
    return upgraded ?? catalog.generalId;
  } catch (catalogError) {
    console.error("Category catalog load failed:", catalogError);

    const { data, error } = await supabase.rpc("resolve_category_id", {
      p_name: itemName,
    });

    if (error) {
      console.error("resolve_category_id RPC failed:", error.message);
      throw new Error(
        "Could not categorise item. Check that Supabase migrations are applied.",
      );
    }

    return data as string;
  }
}

/**
 * Fast dictionary-only resolve for writes. Never calls Gemini.
 * Prefer this before insert/update; use {@link applyAiCategoryUpgrade} afterward if needsAi.
 */
export async function resolveCategoryForWrite(
  supabase: SupabaseClient,
  itemName: string,
  locale = "en",
): Promise<CategoryForWrite> {
  try {
    const catalog = await getCategoryCatalog(supabase);
    const categoryId = resolveCategoryFromCatalog(catalog, itemName, locale);
    return {
      categoryId,
      generalId: catalog.generalId,
      needsAi: categoryId === catalog.generalId,
    };
  } catch (catalogError) {
    console.error("Category catalog load failed:", catalogError);

    const { data, error } = await supabase.rpc("resolve_category_id", {
      p_name: itemName,
    });

    if (error || !data) {
      console.error("resolve_category_id RPC failed:", error?.message);
      throw new Error(
        "Could not categorise item. Check that Supabase migrations are applied.",
      );
    }

    const categoryId = data as string;
    return {
      categoryId,
      generalId: categoryId,
      needsAi: true,
    };
  }
}

/**
 * Call Gemini when dictionary returned General. Returns a better category id, or null.
 * Caches successful aliases. Failures are soft (null).
 */
export async function applyAiCategoryUpgrade(
  supabase: SupabaseClient,
  itemName: string,
  locale: string,
  catalogHint?: Awaited<ReturnType<typeof getCategoryCatalog>>,
): Promise<string | null> {
  try {
    const catalog = catalogHint ?? (await getCategoryCatalog(supabase));
    const slug = await categorizeItemWithGemini({
      itemName,
      locale,
      categories: catalog.categories,
    });
    if (!slug || slug === "general") return null;

    const category = catalog.categories.find((entry) => entry.slug === slug);
    if (!category || category.id === catalog.generalId) return null;

    await cacheAiAlias(itemName, locale, category.id).catch((error) => {
      console.error("[categorisation] Failed to cache AI alias:", error);
    });

    return category.id;
  } catch (error) {
    console.error("[categorisation] AI upgrade failed:", error);
    return null;
  }
}

async function cacheAiAlias(
  itemName: string,
  locale: string,
  categoryId: string,
): Promise<void> {
  const alias = normalizeItemName(itemName);
  if (!alias) return;

  const service = createServiceClient();
  const { error } = await service.from("category_aliases").upsert(
    {
      alias_normalized: alias,
      category_id: categoryId,
      language: locale,
    },
    { onConflict: "alias_normalized,language", ignoreDuplicates: true },
  );

  if (error) {
    throw new Error(error.message);
  }

  clearCategoryCatalogCache();
}

export { getCategoryLabel } from "@/lib/categorisation/labels";
