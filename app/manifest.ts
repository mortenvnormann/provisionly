import type { MetadataRoute } from "next";
import { lightPalette } from "@/lib/design/palette";

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
    background_color: lightPalette.mistWhite,
    theme_color: lightPalette.frostSlate,
    categories: ["shopping", "food", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-180.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
