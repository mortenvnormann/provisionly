import { readFile } from "node:fs/promises";
import path from "node:path";
import { isIconRouteSize } from "@/lib/pwa/icon-sizes";

export async function GET(
  request: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: sizeParam } = await context.params;
  if (!isIconRouteSize(sizeParam)) {
    return new Response("Not found", { status: 404 });
  }

  const purpose =
    new URL(request.url).searchParams.get("purpose") === "maskable"
      ? "maskable"
      : "any";

  const filename =
    purpose === "maskable" && sizeParam === "512"
      ? "icon-512-maskable.png"
      : `icon-${sizeParam}.png`;

  const filePath = path.join(process.cwd(), "public", "icons", filename);

  try {
    const bytes = await readFile(filePath);
    return new Response(bytes, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
