import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeForCategoryMatch } from "@/lib/lists/normalize";
import type { CategoryRow } from "@/lib/lists/types";

type AliasRow = {
  alias_normalized: string;
  category_id: string;
  language: string | null;
  matchKey: string;
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
/** PostgREST/Supabase default max-rows is 1000; page past that so the dictionary is complete. */
const ALIAS_PAGE_SIZE = 1000;

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

async function fetchAllCategoryAliases(
  supabase: SupabaseClient,
): Promise<
  { alias_normalized: string; category_id: string; language: string | null }[]
> {
  const rows: {
    alias_normalized: string;
    category_id: string;
    language: string | null;
  }[] = [];

  for (let from = 0; ; from += ALIAS_PAGE_SIZE) {
    const to = from + ALIAS_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("category_aliases")
      .select("alias_normalized, category_id, language")
      .order("alias_normalized")
      .range(from, to);

    if (error) {
      throw new Error(`category_aliases: ${error.message}`);
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < ALIAS_PAGE_SIZE) break;
  }

  return rows;
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

  const [{ categories, generalId }, aliasRows] = await Promise.all([
    getCategoriesOnly(supabase),
    fetchAllCategoryAliases(supabase),
  ]);

  const catalog: CategoryCatalog = {
    categories,
    aliases: aliasRows.map((row) => ({
      alias_normalized: row.alias_normalized,
      category_id: row.category_id,
      language: row.language,
      matchKey: normalizeForCategoryMatch(row.alias_normalized),
    })),
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
  const normalized = normalizeForCategoryMatch(itemName);
  if (!normalized) return catalog.generalId;

  const matches = catalog.aliases.filter((a) => a.matchKey === normalized);

  if (matches.length === 0) return catalog.generalId;

  const hit =
    matches.find((a) => a.language === locale) ??
    matches.find((a) => a.language === "en") ??
    matches.find((a) => a.language == null) ??
    matches[0];

  return hit.category_id;
}
