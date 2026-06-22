import { ICON_ASSET_VERSION } from "@/lib/pwa/icon-version";

export function iconAssetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${normalized}?v=${ICON_ASSET_VERSION}`;
}
