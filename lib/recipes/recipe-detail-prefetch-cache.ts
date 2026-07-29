import { fetchRecipeDetailAction } from "@/lib/recipes/actions";
import type { RecipeDetail } from "@/lib/recipes/types";

const cache = new Map<string, RecipeDetail>();
const inFlight = new Map<string, Promise<RecipeDetail>>();

export function getPrefetchedRecipeDetail(recipeId: string): RecipeDetail | null {
  return cache.get(recipeId) ?? null;
}

export function hasPrefetchedRecipeDetail(recipeId: string): boolean {
  return cache.has(recipeId);
}

export function prefetchRecipeDetailData(
  recipeId: string,
): Promise<RecipeDetail> {
  const cached = cache.get(recipeId);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = inFlight.get(recipeId);
  if (pending) {
    return pending;
  }

  const promise = fetchRecipeDetailAction(recipeId)
    .then((data) => {
      cache.set(recipeId, data);
      return data;
    })
    .finally(() => {
      inFlight.delete(recipeId);
    });

  inFlight.set(recipeId, promise);
  return promise;
}

export function invalidatePrefetchedRecipeDetail(recipeId?: string): void {
  if (recipeId) {
    cache.delete(recipeId);
    inFlight.delete(recipeId);
    return;
  }
  cache.clear();
  inFlight.clear();
}
