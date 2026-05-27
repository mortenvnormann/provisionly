export function scaleQuantity(
  quantity: number | null,
  defaultServings: number,
  targetServings: number,
): number | null {
  if (quantity == null) return null;
  if (defaultServings <= 0 || targetServings <= 0) return quantity;
  return Math.round((quantity * targetServings / defaultServings) * 100) / 100;
}
