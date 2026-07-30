export const RECIPE_IMPORT_ERROR_CODES = {
  invalidUrl: "recipe_import_invalid_url",
  fetchFailed: "recipe_import_fetch_failed",
  noRecipeFound: "recipe_import_no_recipe_found",
} as const;

export type RecipeImportErrorCode =
  (typeof RECIPE_IMPORT_ERROR_CODES)[keyof typeof RECIPE_IMPORT_ERROR_CODES];

export function isRecipeImportErrorCode(
  value: string,
): value is RecipeImportErrorCode {
  return Object.values(RECIPE_IMPORT_ERROR_CODES).includes(
    value as RecipeImportErrorCode,
  );
}
