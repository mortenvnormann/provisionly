"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getCategoryCatalog,
  type CategoryCatalog,
} from "@/lib/categorisation/catalog";
import { getCategoryLabel } from "@/lib/categorisation/resolve";
import type { CategoryRow } from "@/lib/lists/types";
import { createClient } from "@/utils/supabase/client";

export function useCategories(locale = "en") {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const supabase = createClient();
      const catalog: CategoryCatalog = await getCategoryCatalog(supabase);
      setCategories(catalog.categories);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load categories";
      setError(message);
      console.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  function labelFor(categoryId: string | null): string {
    if (!categoryId) return "General";
    const cat = categoryMap.get(categoryId);
    if (!cat) return "General";
    return getCategoryLabel(cat, locale);
  }

  return { categories, categoryMap, labelFor, loading, error, reload: load };
}
