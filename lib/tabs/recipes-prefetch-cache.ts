import { fetchRecipesAction } from "@/lib/recipes/actions";
import type { RecipeSummary } from "@/lib/recipes/types";

let cachedRecipes: RecipeSummary[] | null = null;
let inFlight: Promise<RecipeSummary[]> | null = null;

export function getPrefetchedRecipes(): RecipeSummary[] | null {
  return cachedRecipes;
}

export function prefetchRecipesData(): Promise<RecipeSummary[]> {
  if (cachedRecipes) {
    return Promise.resolve(cachedRecipes);
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = fetchRecipesAction()
    .then((recipes) => {
      cachedRecipes = recipes;
      return recipes;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function invalidatePrefetchedRecipes(): void {
  cachedRecipes = null;
  inFlight = null;
}
