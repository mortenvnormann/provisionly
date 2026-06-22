"use client";

import { useEffect, useRef } from "react";
import { fetchRecipeDetailAction } from "@/lib/recipes/actions";
import type { RecipeDetail } from "@/lib/recipes/types";
import { createClient } from "@/utils/supabase/client";

type UseRecipeSyncOptions = {
  recipeId: string;
  enabled: boolean;
  onRecipeChange: (recipe: RecipeDetail) => void;
};

function recipeFingerprint(recipe: RecipeDetail): string {
  return [
    recipe.title,
    recipe.description ?? "",
    recipe.defaultServings,
    recipe.ingredients
      .map(
        (i) =>
          `${i.id}:${i.name}:${i.quantity}:${i.unit}:${i.position}`,
      )
      .join("|"),
  ].join("::");
}

export function useRecipeSync({
  recipeId,
  enabled,
  onRecipeChange,
}: UseRecipeSyncOptions) {
  const fingerprintRef = useRef("");
  const onRecipeChangeRef = useRef(onRecipeChange);

  useEffect(() => {
    onRecipeChangeRef.current = onRecipeChange;
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function sync() {
      if (document.visibilityState !== "visible") return;
      try {
        const recipe = await fetchRecipeDetailAction(recipeId);
        if (cancelled) return;

        const fingerprint = recipeFingerprint(recipe);
        if (fingerprint !== fingerprintRef.current) {
          fingerprintRef.current = fingerprint;
          onRecipeChangeRef.current(recipe);
        }
      } catch {
        // Ignore transient network errors during sync
      }
    }

    void sync();

    const supabase = createClient();
    const channel = supabase
      .channel(`recipe-sync:${recipeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recipe_ingredients",
          filter: `recipe_id=eq.${recipeId}`,
        },
        () => {
          void sync();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "recipes",
          filter: `id=eq.${recipeId}`,
        },
        () => {
          void sync();
        },
      )
      .subscribe();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void sync();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, recipeId]);
}
