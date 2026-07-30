"use client";

import { useCallback, useEffect, useState } from "react";
import { getCategoriesOnly } from "@/lib/categorisation/catalog";
import { getCategoryLabel } from "@/lib/categorisation/resolve";
import type { CategoryRow } from "@/lib/lists/types";
import { createClient } from "@/utils/supabase/client";

export function useCategories(
  locale = "en",
  generalLabel = "General",
  initialCategories?: CategoryRow[],
  loadFailedLabel = "Could not load categories",
) {
  const hasInitial = (initialCategories?.length ?? 0) > 0;
  const [categories, setCategories] = useState<CategoryRow[]>(
    initialCategories ?? [],
  );
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategories?.length) {
      setCategories(initialCategories);
      setLoading(false);
    }
  }, [initialCategories]);

  const load = useCallback(async () => {
    if (hasInitial) {
      setLoading(false);
      return;
    }

    setError(null);
    try {
      const supabase = createClient();
      const { categories: rows } = await getCategoriesOnly(supabase);
      setCategories(rows);
    } catch (err) {
      console.error(err);
      setError(loadFailedLabel);
    } finally {
      setLoading(false);
    }
  }, [hasInitial, loadFailedLabel]);

  useEffect(() => {
    void load();
  }, [load]);

  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  function labelFor(categoryId: string | null): string {
    if (!categoryId) return generalLabel;
    const cat = categoryMap.get(categoryId);
    if (!cat) return generalLabel;
    return getCategoryLabel(cat, locale);
  }

  return { categories, categoryMap, labelFor, loading, error, reload: load };
}
