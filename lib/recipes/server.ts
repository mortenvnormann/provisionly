import "server-only";

import { resolveCategoryId } from "@/lib/categorisation/resolve";
import { getLocaleForUser } from "@/lib/i18n/user-locale";
import { assertListAccess } from "@/lib/lists/server";
import { normalizeItemName, nextSortKey } from "@/lib/lists/normalize";
import { scaleQuantity } from "@/lib/recipes/scale";
import {
  copyRecipePhotoObject,
  deleteRecipePhotoObjects,
  processRecipePhoto,
  removeRecipePhotoObject,
  uploadRecipePhotoBytes,
} from "@/lib/storage/recipe-photo";
import { getRecipePhotoSignedUrl } from "@/lib/storage/urls";
import type {
  AddToListResult,
  RecipeDetail,
  RecipeInput,
  RecipeIngredientRow,
  RecipePhotoResult,
  RecipeSummary,
} from "@/lib/recipes/types";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

type RecipeAccess = {
  canView: boolean;
  isOwner: boolean;
};

async function getRecipeAccess(
  userId: string,
  recipeId: string,
): Promise<RecipeAccess> {
  const service = createServiceClient();

  const [{ data: recipe }, { data: access }] = await Promise.all([
    service.from("recipes").select("owner_id").eq("id", recipeId).maybeSingle(),
    service
      .from("recipe_access")
      .select("recipe_id")
      .eq("recipe_id", recipeId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!recipe) return { canView: false, isOwner: false };

  const isOwner = recipe.owner_id === userId;
  const canView = isOwner || !!access;
  return { canView, isOwner };
}

async function assertRecipeView(userId: string, recipeId: string): Promise<RecipeAccess> {
  const access = await getRecipeAccess(userId, recipeId);
  if (!access.canView) throw new Error("Recipe not found");
  return access;
}

export async function assertRecipeViewAccess(
  userId: string,
  recipeId: string,
): Promise<void> {
  await assertRecipeView(userId, recipeId);
}

async function assertRecipeOwner(userId: string, recipeId: string): Promise<void> {
  const access = await getRecipeAccess(userId, recipeId);
  if (!access.isOwner) throw new Error("Recipe not found");
}

async function mapRecipeImage(
  imagePath: string | null | undefined,
): Promise<{ imagePath: string | null; imageUrl: string | null }> {
  const path = imagePath ?? null;
  return {
    imagePath: path,
    imageUrl: await getRecipePhotoSignedUrl(path),
  };
}

async function mapRecipeDetail(
  recipe: {
    id: string;
    title: string;
    description: string | null;
    instructions: string;
    tags: string[] | null;
    default_servings: number;
    prep_minutes: number | null;
    cook_minutes: number | null;
    updated_at: string;
    owner_id: string;
    image_path: string | null;
    source_url: string | null;
  },
  userId: string,
  isOwner: boolean,
  ingredients: RecipeIngredientRow[],
): Promise<RecipeDetail> {
  const image = await mapRecipeImage(recipe.image_path);
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description ?? "",
    instructions: recipe.instructions,
    tags: recipe.tags ?? [],
    defaultServings: recipe.default_servings,
    prepMinutes: recipe.prep_minutes,
    cookMinutes: recipe.cook_minutes,
    updatedAt: recipe.updated_at,
    ownerId: recipe.owner_id,
    isOwner,
    imagePath: image.imagePath,
    imageUrl: image.imageUrl,
    sourceUrl: recipe.source_url,
    ingredients,
  };
}

export async function uploadRecipePhotoForUser(
  userId: string,
  recipeId: string,
  file: Blob,
): Promise<RecipePhotoResult> {
  await assertRecipeOwner(userId, recipeId);
  const bytes = await processRecipePhoto(file);
  const imagePath = await uploadRecipePhotoBytes(recipeId, bytes);

  const service = createServiceClient();
  const { error } = await service
    .from("recipes")
    .update({ image_path: imagePath })
    .eq("id", recipeId);

  if (error) throw new Error(error.message);

  const imageUrl = await getRecipePhotoSignedUrl(imagePath);
  if (!imageUrl) throw new Error("Could not create photo URL");

  return { imagePath, imageUrl };
}

export async function removeRecipePhotoForUser(
  userId: string,
  recipeId: string,
): Promise<void> {
  await assertRecipeOwner(userId, recipeId);
  await removeRecipePhotoObject(recipeId);

  const service = createServiceClient();
  const { error } = await service
    .from("recipes")
    .update({ image_path: null })
    .eq("id", recipeId);

  if (error) throw new Error(error.message);
}

function mapIngredient(row: {
  id: string;
  recipe_id: string;
  name_original: string;
  quantity: number | null;
  unit: string | null;
  category_id: string | null;
  position: number;
}): RecipeIngredientRow {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    name: row.name_original,
    quantity: row.quantity,
    unit: row.unit,
    categoryId: row.category_id,
    position: row.position,
  };
}

export async function fetchRecipeSummariesForUser(
  userId: string,
): Promise<RecipeSummary[]> {
  const service = createServiceClient();

  const [{ data: owned }, { data: shared }] = await Promise.all([
    service.from("recipes").select("id").eq("owner_id", userId),
    service.from("recipe_access").select("recipe_id").eq("user_id", userId),
  ]);

  const ids = new Set<string>();
  for (const row of owned ?? []) ids.add(row.id);
  for (const row of shared ?? []) ids.add(row.recipe_id);
  if (ids.size === 0) return [];

  const { data, error } = await service
    .from("recipes")
    .select("id, title, default_servings, prep_minutes, cook_minutes, updated_at, owner_id")
    .in("id", [...ids])
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    defaultServings: row.default_servings,
    prepMinutes: row.prep_minutes,
    cookMinutes: row.cook_minutes,
    updatedAt: row.updated_at,
    isOwner: row.owner_id === userId,
  }));
}

export async function fetchRecipeDetailForUser(
  userId: string,
  recipeId: string,
): Promise<RecipeDetail> {
  const service = createServiceClient();

  const [
    { data: recipe, error: recipeError },
    { data: ingredients, error: ingError },
    { data: access },
  ] = await Promise.all([
    service
      .from("recipes")
      .select(
        "id, title, description, instructions, tags, default_servings, prep_minutes, cook_minutes, updated_at, owner_id, image_path, source_url",
      )
      .eq("id", recipeId)
      .maybeSingle(),
    service
      .from("recipe_ingredients")
      .select(
        "id, recipe_id, name_original, quantity, unit, category_id, position",
      )
      .eq("recipe_id", recipeId)
      .order("position"),
    service
      .from("recipe_access")
      .select("recipe_id")
      .eq("recipe_id", recipeId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (recipeError) throw new Error(recipeError.message);
  if (!recipe) throw new Error("Recipe not found");
  if (ingError) throw new Error(ingError.message);

  const isOwner = recipe.owner_id === userId;
  const canView = isOwner || !!access;
  if (!canView) throw new Error("Recipe not found");

  return mapRecipeDetail(recipe, userId, isOwner, (ingredients ?? []).map(mapIngredient));
}

async function insertRecipeIngredients(
  userId: string,
  recipeId: string,
  ingredients: RecipeInput["ingredients"],
): Promise<void> {
  if (ingredients.length === 0) return;

  const cookieStore = await cookies();
  const userClient = createClient(cookieStore);
  const service = createServiceClient();
  const locale = await getLocaleForUser(userId);

  const rows = await Promise.all(
    ingredients.map(async (item, index) => {
      const name = item.name.trim();
      return {
        recipe_id: recipeId,
        name_original: name,
        name_normalized: normalizeItemName(name),
        quantity: item.quantity ?? null,
        unit: item.unit?.trim() || null,
        category_id: await resolveCategoryId(userClient, name, locale).catch(
          () => null,
        ),
        position: index,
      };
    }),
  );

  const { error } = await service.from("recipe_ingredients").insert(rows);
  if (error) throw new Error(error.message);
}

export async function createRecipeForUser(
  userId: string,
  input: RecipeInput,
): Promise<RecipeSummary> {
  const service = createServiceClient();
  const title = input.title.trim() || "Untitled recipe";

  const { data, error } = await service
    .from("recipes")
    .insert({
      owner_id: userId,
      title,
      description: input.description.trim(),
      instructions: input.instructions.trim(),
      tags: input.tags.filter(Boolean),
      default_servings: Math.max(1, input.defaultServings),
      prep_minutes: input.prepMinutes ?? null,
      cook_minutes: input.cookMinutes ?? null,
      source_url: input.sourceUrl?.trim() || null,
    })
    .select("id, title, default_servings, prep_minutes, cook_minutes, updated_at, owner_id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create recipe");

  await insertRecipeIngredients(userId, data.id, input.ingredients);

  return {
    id: data.id,
    title: data.title,
    defaultServings: data.default_servings,
    prepMinutes: data.prep_minutes,
    cookMinutes: data.cook_minutes,
    updatedAt: data.updated_at,
    isOwner: true,
  };
}

export async function updateRecipeForUser(
  userId: string,
  recipeId: string,
  input: RecipeInput,
): Promise<void> {
  await assertRecipeOwner(userId, recipeId);
  const service = createServiceClient();

  const { error: updateError } = await service
    .from("recipes")
    .update({
      title: input.title.trim() || "Untitled recipe",
      description: input.description.trim(),
      instructions: input.instructions.trim(),
      tags: input.tags.filter(Boolean),
      default_servings: Math.max(1, input.defaultServings),
      prep_minutes: input.prepMinutes ?? null,
      cook_minutes: input.cookMinutes ?? null,
      ...(input.sourceUrl !== undefined
        ? { source_url: input.sourceUrl?.trim() || null }
        : {}),
    })
    .eq("id", recipeId);

  if (updateError) throw new Error(updateError.message);

  const { error: deleteError } = await service
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", recipeId);

  if (deleteError) throw new Error(deleteError.message);

  await insertRecipeIngredients(userId, recipeId, input.ingredients);
}

export async function deleteRecipeForUser(
  userId: string,
  recipeId: string,
): Promise<void> {
  await assertRecipeOwner(userId, recipeId);
  await deleteRecipePhotoObjects([recipeId]);
  const service = createServiceClient();

  const { error } = await service.from("recipes").delete().eq("id", recipeId);
  if (error) throw new Error(error.message);
}

export async function removeRecipeAccessForUser(
  userId: string,
  recipeId: string,
): Promise<void> {
  const access = await getRecipeAccess(userId, recipeId);
  if (!access.canView) throw new Error("Recipe not found");
  if (access.isOwner) {
    throw new Error("Owners cannot remove their own recipe this way");
  }

  const service = createServiceClient();
  const { error } = await service
    .from("recipe_access")
    .delete()
    .eq("recipe_id", recipeId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function cloneRecipeForUser(
  userId: string,
  recipeId: string,
): Promise<RecipeSummary> {
  const source = await fetchRecipeDetailForUser(userId, recipeId);
  const service = createServiceClient();

  const { data: clone, error: cloneError } = await service
    .from("recipes")
    .insert({
      owner_id: userId,
      title: `${source.title} (copy)`,
      description: source.description,
      instructions: source.instructions,
      tags: source.tags,
      default_servings: source.defaultServings,
      prep_minutes: source.prepMinutes,
      cook_minutes: source.cookMinutes,
      source_url: source.sourceUrl,
    })
    .select("id, title, default_servings, prep_minutes, cook_minutes, updated_at, owner_id")
    .single();

  if (cloneError || !clone) {
    throw new Error(cloneError?.message ?? "Could not clone recipe");
  }

  if (source.ingredients.length > 0) {
    const { error: ingError } = await service.from("recipe_ingredients").insert(
      source.ingredients.map((item) => ({
        recipe_id: clone.id,
        name_original: item.name,
        name_normalized: normalizeItemName(item.name),
        quantity: item.quantity,
        unit: item.unit,
        category_id: item.categoryId,
        position: item.position,
      })),
    );
    if (ingError) throw new Error(ingError.message);
  }

  const { error: auditError } = await service.from("recipe_clones").insert({
    original_recipe_id: recipeId,
    cloned_recipe_id: clone.id,
    cloned_by: userId,
  });

  if (auditError) throw new Error(auditError.message);

  if (source.imagePath) {
    const copiedPath = await copyRecipePhotoObject(recipeId, clone.id);
    if (copiedPath) {
      const { error: imageError } = await service
        .from("recipes")
        .update({ image_path: copiedPath })
        .eq("id", clone.id);
      if (imageError) throw new Error(imageError.message);
    }
  }

  return {
    id: clone.id,
    title: clone.title,
    defaultServings: clone.default_servings,
    prepMinutes: clone.prep_minutes,
    cookMinutes: clone.cook_minutes,
    updatedAt: clone.updated_at,
    isOwner: true,
  };
}

function unitsMatch(a: string | null, b: string | null): boolean {
  const left = a?.trim().toLowerCase() ?? "";
  const right = b?.trim().toLowerCase() ?? "";
  return left === right;
}

export async function addRecipeIngredientsToListForUser(
  userId: string,
  recipeId: string,
  listId: string,
  options: {
    targetServings: number;
    selectedIngredientIds: string[];
  },
): Promise<AddToListResult> {
  const recipe = await fetchRecipeDetailForUser(userId, recipeId);
  await assertListAccess(userId, listId);

  const selected = new Set(options.selectedIngredientIds);
  const toAdd = recipe.ingredients.filter((item) => selected.has(item.id));
  if (toAdd.length === 0) return { added: 0, merged: 0 };

  const service = createServiceClient();
  const { data: existingItems, error: fetchError } = await service
    .from("list_items")
    .select(
      "id, name_original, name_normalized, quantity, unit, sort_key, checked",
    )
    .eq("list_id", listId);

  if (fetchError) throw new Error(fetchError.message);

  const items = existingItems ?? [];
  let added = 0;
  let merged = 0;
  const sortKeys = items.map((item) => item.sort_key);
  const locale = await getLocaleForUser(userId);

  for (const ingredient of toAdd) {
    const scaledQty = scaleQuantity(
      ingredient.quantity,
      recipe.defaultServings,
      options.targetServings,
    );
    const normalized = normalizeItemName(ingredient.name);
    const unit = ingredient.unit?.trim() || null;

    const match = items.find(
      (item) =>
        !item.checked &&
        item.name_normalized === normalized &&
        unitsMatch(item.unit, unit),
    );

    if (match) {
      let nextQty = scaledQty;
      if (scaledQty != null && match.quantity != null) {
        nextQty = Math.round((scaledQty + Number(match.quantity)) * 100) / 100;
      } else if (scaledQty == null && match.quantity != null) {
        nextQty = Number(match.quantity);
      }

      const { error } = await service
        .from("list_items")
        .update({ quantity: nextQty })
        .eq("id", match.id);

      if (error) throw new Error(error.message);
      match.quantity = nextQty;
      merged += 1;
      continue;
    }

    const cookieStore = await cookies();
    const userClient = createClient(cookieStore);
    const categoryId =
      ingredient.categoryId ??
      (await resolveCategoryId(userClient, ingredient.name, locale).catch(
        () => null,
      ));

    const sortKey = nextSortKey(sortKeys);
    sortKeys.push(sortKey);

    const { data: inserted, error: insertError } = await service
      .from("list_items")
      .insert({
        list_id: listId,
        name_original: ingredient.name,
        name_normalized: normalized,
        quantity: scaledQty,
        unit,
        category_id: categoryId,
        checked: false,
        sort_key: sortKey,
      })
      .select("id, name_original, name_normalized, quantity, unit, sort_key, checked")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Could not add item to list");
    }

    items.push(inserted);
    added += 1;
  }

  return { added, merged };
}
