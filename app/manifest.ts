import type { MetadataRoute } from "next";
import { lightPalette } from "@/lib/design/palette";
import { iconAssetUrl } from "@/lib/pwa/icon-url";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Provisionly",
    short_name: "Provisionly",
    description: "Minimal collaborative grocery lists and recipes",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: lightPalette.canvasWarm,
    theme_color: lightPalette.terracotta,
    categories: ["shopping", "food", "productivity"],
    icons: [
      {
        src: iconAssetUrl("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: iconAssetUrl("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: iconAssetUrl("/icons/icon-512-maskable.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: iconAssetUrl("/icons/icon-180.png"),
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
