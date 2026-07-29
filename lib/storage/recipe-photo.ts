import "server-only";

import sharp from "sharp";
import { RECIPE_IMAGES_BUCKET } from "@/lib/storage/urls";
import { RECIPE_PHOTO_MAX_BYTES, RECIPE_PHOTO_MIME_TYPES } from "@/lib/validation/schemas";
import { createServiceClient } from "@/lib/supabase/service";

export function recipePhotoPath(recipeId: string): string {
  return `${recipeId}/photo.webp`;
}

export async function processRecipePhoto(file: Blob): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > RECIPE_PHOTO_MAX_BYTES) {
    throw new Error("Photo must be 2MB or smaller");
  }

  const mimeType = file.type?.toLowerCase() ?? "";
  if (mimeType && !RECIPE_PHOTO_MIME_TYPES.has(mimeType)) {
    throw new Error("Photo must be JPEG, PNG, WebP, or HEIC");
  }

  try {
    return await sharp(Buffer.from(arrayBuffer))
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new Error("Could not process photo");
  }
}

export async function uploadRecipePhotoBytes(
  recipeId: string,
  bytes: Buffer,
): Promise<string> {
  const service = createServiceClient();
  const path = recipePhotoPath(recipeId);

  const { error } = await service.storage
    .from(RECIPE_IMAGES_BUCKET)
    .upload(path, bytes, {
      contentType: "image/webp",
      upsert: true,
    });

  if (error) throw new Error(error.message);
  return path;
}

export async function removeRecipePhotoObject(recipeId: string): Promise<void> {
  const service = createServiceClient();
  const path = recipePhotoPath(recipeId);
  const { error } = await service.storage.from(RECIPE_IMAGES_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export async function copyRecipePhotoObject(
  sourceRecipeId: string,
  targetRecipeId: string,
): Promise<string | null> {
  const service = createServiceClient();
  const sourcePath = recipePhotoPath(sourceRecipeId);
  const targetPath = recipePhotoPath(targetRecipeId);

  const { data: sourceFile, error: downloadError } = await service.storage
    .from(RECIPE_IMAGES_BUCKET)
    .download(sourcePath);

  if (downloadError || !sourceFile) return null;

  const bytes = Buffer.from(await sourceFile.arrayBuffer());
  const { error: uploadError } = await service.storage
    .from(RECIPE_IMAGES_BUCKET)
    .upload(targetPath, bytes, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);
  return targetPath;
}

export async function deleteRecipePhotoObjects(recipeIds: string[]): Promise<void> {
  if (recipeIds.length === 0) return;

  const service = createServiceClient();
  const paths = recipeIds.map(recipePhotoPath);
  const { error } = await service.storage.from(RECIPE_IMAGES_BUCKET).remove(paths);
  if (error) throw new Error(error.message);
}
