import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export const RECIPE_IMAGES_BUCKET = "recipe-images";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

export async function getRecipePhotoSignedUrl(
  imagePath: string | null,
): Promise<string | null> {
  if (!imagePath) return null;

  const service = createServiceClient();
  const { data, error } = await service.storage
    .from(RECIPE_IMAGES_BUCKET)
    .createSignedUrl(imagePath, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
