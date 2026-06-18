/** Sizes served from `/icons/[size]` (PNG). */
export const ICON_ROUTE_SIZES = [
  32, 48, 72, 96, 128, 144, 180, 192, 384, 512,
] as const;

export type IconRouteSize = (typeof ICON_ROUTE_SIZES)[number];

export function isIconRouteSize(value: string): value is `${IconRouteSize}` {
  return ICON_ROUTE_SIZES.some((size) => String(size) === value);
}
