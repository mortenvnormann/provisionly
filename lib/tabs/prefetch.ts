import { prefetchRecipesData } from "@/lib/tabs/recipes-prefetch-cache";

export function prefetchRecipesHome(): void {
  void import("@/components/recipes/recipes-home");
  void prefetchRecipesData();
}

export function prefetchListsHome(): void {
  void import("@/components/lists/lists-home");
}

export { prefetchRecipesData, getPrefetchedRecipes } from "@/lib/tabs/recipes-prefetch-cache";
