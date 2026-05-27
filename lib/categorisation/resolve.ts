import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getCategoryCatalog,
  resolveCategoryFromCatalog,
} from "@/lib/categorisation/catalog";

export async function resolveCategoryId(
  supabase: SupabaseClient,
  itemName: string,
  locale = "en",
): Promise<string> {
  try {
    const catalog = await getCategoryCatalog(supabase);
    return resolveCategoryFromCatalog(catalog, itemName, locale);
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
