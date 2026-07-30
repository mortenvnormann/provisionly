export const SHARE_ERROR_CODES = {
  invalid: "share_invalid",
  expired: "share_expired",
  listGone: "share_list_gone",
  recipeGone: "share_recipe_gone",
} as const;

export type ShareErrorCode =
  (typeof SHARE_ERROR_CODES)[keyof typeof SHARE_ERROR_CODES];

export function isShareErrorCode(value: string): value is ShareErrorCode {
  return Object.values(SHARE_ERROR_CODES).includes(value as ShareErrorCode);
}
