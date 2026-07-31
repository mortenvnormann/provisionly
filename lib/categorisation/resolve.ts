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

    const slug = await categorizeItemWithGemini({
      itemName,
      locale,
      categories: catalog.categories,
    });
    if (!slug || slug === "general") {
      return catalog.generalId;
    }

    const category = catalog.categories.find((entry) => entry.slug === slug);
    if (!category) return catalog.generalId;

    await cacheAiAlias(itemName, locale, category.id).catch((error) => {
      console.error("[categorisation] Failed to cache AI alias:", error);
    });

    return category.id;
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

export function getCategoryLabel(
  category: { labels: Record<string, string>; slug: string },
  locale: string,
): string {
  return (
    category.labels[locale] ??
    category.labels.en ??
    category.slug.replace(/_/g, " ")
  );
}
