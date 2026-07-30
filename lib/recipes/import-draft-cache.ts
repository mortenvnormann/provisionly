import type { RecipeInput } from "@/lib/recipes/types";

const STORAGE_KEY = "provisionly:recipe-import-draft";

export function setRecipeImportDraft(input: RecipeInput): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    // Ignore quota / private mode failures
  }
}

export function consumeRecipeImportDraft(): RecipeInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    return JSON.parse(raw) as RecipeInput;
  } catch {
    return null;
  }
}
