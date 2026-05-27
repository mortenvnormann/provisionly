import { ImageResponse } from "next/og";
import { ProvisionlyIcon } from "@/lib/pwa/icon-markup";

const ALLOWED = new Set(["192", "512"]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: sizeParam } = await context.params;
  if (!ALLOWED.has(sizeParam)) {
    return new Response("Not found", { status: 404 });
  }

  const size = Number.parseInt(sizeParam, 10);
  return new ImageResponse(<ProvisionlyIcon size={size} />, {
    width: size,
    height: size,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
