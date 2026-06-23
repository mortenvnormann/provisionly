import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeItemName } from "@/lib/lists/normalize";
import type { CategoryRow } from "@/lib/lists/types";

type AliasRow = {
  alias_normalized: string;
  category_id: string;
  language: string | null;
};

export type CategoryCatalog = {
  categories: CategoryRow[];
  aliases: AliasRow[];
  generalId: string;
};

let cache: { catalog: CategoryCatalog; expiresAt: number } | null = null;
let categoriesOnlyCache: {
  categories: CategoryRow[];
  generalId: string;
  expiresAt: number;
} | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export function clearCategoryCatalogCache() {
  cache = null;
  categoriesOnlyCache = null;
}

function mapCategoryRows(
  data: {
    id: string;
    slug: string;
    sort_order: number;
    color: string;
    labels: unknown;
  }[],
): CategoryRow[] {
  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    sortOrder: row.sort_order,
    color: row.color,
    labels: row.labels as Record<string, string>,
  }));
}

function resolveGeneralId(categories: CategoryRow[]): string {
  return (
    categories.find((category) => category.slug === "general")?.id ??
    categories[categories.length - 1].id
  );
}

export async function getCategoriesOnly(
  supabase: SupabaseClient,
): Promise<{ categories: CategoryRow[]; generalId: string }> {
  if (categoriesOnlyCache && Date.now() < categoriesOnlyCache.expiresAt) {
    return {
      categories: categoriesOnlyCache.categories,
      generalId: categoriesOnlyCache.generalId,
    };
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, sort_order, color, labels")
    .order("sort_order");

  if (error) {
    throw new Error(`categories: ${error.message}`);
  }

  const categories = mapCategoryRows(data ?? []);
  if (categories.length === 0) {
    throw new Error(
      "No categories in database. Run Supabase migrations (supabase db push).",
    );
  }

  const generalId = resolveGeneralId(categories);
  categoriesOnlyCache = {
    categories,
    generalId,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return { categories, generalId };
}

export async function getCategoryCatalog(
  supabase: SupabaseClient,
): Promise<CategoryCatalog> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.catalog;
  }

  const [{ categories, generalId }, aliasesRes] = await Promise.all([
    getCategoriesOnly(supabase),
    supabase
      .from("category_aliases")
      .select("alias_normalized, category_id, language"),
  ]);

  if (aliasesRes.error) {
    throw new Error(`category_aliases: ${aliasesRes.error.message}`);
  }

  const catalog: CategoryCatalog = {
    categories,
    aliases: aliasesRes.data ?? [],
    generalId,
  };

  cache = { catalog, expiresAt: Date.now() + CACHE_TTL_MS };
  return catalog;
}

/** Match item name to a category using the alias dictionary (same rules as SQL RPC). */
export function resolveCategoryFromCatalog(
  catalog: CategoryCatalog,
  itemName: string,
  locale = "en",
): string {
  const normalized = normalizeItemName(itemName);
  if (!normalized) return catalog.generalId;

  const matches = catalog.aliases.filter(
    (a) => a.alias_normalized === normalized,
  );

  if (matches.length === 0) return catalog.generalId;

  const hit =
    matches.find((a) => a.language === locale) ??
    matches.find((a) => a.language === "en") ??
    matches.find((a) => a.language == null) ??
    matches[0];

  return hit.category_id;
}
