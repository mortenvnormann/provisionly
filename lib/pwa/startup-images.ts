import { ICON_ASSET_VERSION } from "@/lib/pwa/icon-version";

/** Portrait iPhone startup images (CSS device size × pixel ratio). */
export const APPLE_STARTUP_IMAGES = [
  {
    width: 750,
    height: 1334,
    media:
      "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    width: 828,
    height: 1792,
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    width: 1125,
    height: 2436,
    media:
      "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    width: 1170,
    height: 2532,
    media:
      "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    width: 1179,
    height: 2556,
    media:
      "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    width: 1206,
    height: 2622,
    media:
      "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    width: 1284,
    height: 2778,
    media:
      "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    width: 1290,
    height: 2796,
    media:
      "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    width: 1320,
    height: 2868,
    media:
      "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
] as const;

export function startupImagePath(width: number, height: number): string {
  return `/splash/apple-splash-${width}-${height}.png`;
}

export function appleStartupImages() {
  return APPLE_STARTUP_IMAGES.map((entry) => ({
    url: `${startupImagePath(entry.width, entry.height)}?v=${ICON_ASSET_VERSION}`,
    media: entry.media,
  }));
}
