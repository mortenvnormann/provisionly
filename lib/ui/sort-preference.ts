export type SortMode = "recent" | "alpha";
export type SortPreferenceScope = "lists" | "recipes";

const KEYS: Record<SortPreferenceScope, string> = {
  lists: "provisionly-sort-lists",
  recipes: "provisionly-sort-recipes",
};

function isSortMode(value: string | null): value is SortMode {
  return value === "recent" || value === "alpha";
}

export function getSortPreference(scope: SortPreferenceScope): SortMode {
  if (typeof localStorage === "undefined") return "recent";
  try {
    const raw = localStorage.getItem(KEYS[scope]);
    return isSortMode(raw) ? raw : "recent";
  } catch {
    return "recent";
  }
}

export function setSortPreference(
  scope: SortPreferenceScope,
  mode: SortMode,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEYS[scope], mode);
  } catch {
    // Ignore quota / private-mode failures.
  }
}
