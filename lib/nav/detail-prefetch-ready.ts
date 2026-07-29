import { hasPrefetchedListDetail } from "@/lib/lists/list-detail-prefetch-cache";
import { hasPrefetchedRecipeDetail } from "@/lib/recipes/recipe-detail-prefetch-cache";

export function hasWarmDetailForPath(pathname: string): boolean {
  const listMatch = pathname.match(/^\/lists\/([^/]+)$/);
  if (listMatch?.[1]) {
    return hasPrefetchedListDetail(listMatch[1]);
  }

  const recipeMatch = pathname.match(/^\/recipes\/([^/]+)$/);
  if (recipeMatch?.[1] && recipeMatch[1] !== "new") {
    return hasPrefetchedRecipeDetail(recipeMatch[1]);
  }

  return false;
}
