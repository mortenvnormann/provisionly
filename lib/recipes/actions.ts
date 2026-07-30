"use server";

import { revalidatePath } from "next/cache";
import { getVerifiedUser } from "@/lib/auth/get-user";
import { fetchListSummariesForUser } from "@/lib/lists/server";
import {
  parseAddRecipeToListOptions,
  parseListId,
  parseRecipeId,
  parseRecipeInput,
} from "@/lib/validation/parse";
import type { ListSummary } from "@/lib/lists/types";
import {
  addRecipeIngredientsToListForUser,
  cloneRecipeForUser,
  createRecipeForUser,
  deleteRecipeForUser,
  fetchRecipeDetailForUser,
  fetchRecipeSummariesForUser,
  removeRecipeAccessForUser,
  removeRecipePhotoForUser,
  updateRecipeForUser,
  uploadRecipePhotoForUser,
} from "@/lib/recipes/server";
import { AppError } from "@/lib/errors/app-error";
import { RECIPE_IMPORT_ERROR_CODES } from "@/lib/errors/recipe-import-codes";
import {
  fetchRecipeHtml,
  mapHtmlToRecipeInput,
  normalizeImportUrl,
} from "@/lib/recipes/import-from-url";
import { invalidatePrefetchedRecipeDetail } from "@/lib/recipes/recipe-detail-prefetch-cache";
import { invalidatePrefetchedRecipes } from "@/lib/tabs/recipes-prefetch-cache";
import type {
  AddToListResult,
  RecipeDetail,
  RecipeInput,
  RecipePhotoResult,
  RecipeSummary,
} from "@/lib/recipes/types";

export async function fetchRecipesAction(): Promise<RecipeSummary[]> {
  const user = await getVerifiedUser();
  return fetchRecipeSummariesForUser(user.id);
}

export async function fetchRecipeDetailAction(
  recipeId: string,
): Promise<RecipeDetail> {
  const user = await getVerifiedUser();
  return fetchRecipeDetailForUser(user.id, parseRecipeId(recipeId));
}

export async function createRecipeAction(
  input: RecipeInput,
): Promise<RecipeSummary> {
  const user = await getVerifiedUser();
  const recipe = await createRecipeForUser(user.id, parseRecipeInput(input));
  revalidatePath("/recipes");
  return recipe;
}

export async function updateRecipeAction(
  recipeId: string,
  input: RecipeInput,
): Promise<void> {
  const user = await getVerifiedUser();
  const id = parseRecipeId(recipeId);
  await updateRecipeForUser(user.id, id, parseRecipeInput(input));
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
}

export async function deleteRecipeAction(recipeId: string): Promise<void> {
  const user = await getVerifiedUser();
  await deleteRecipeForUser(user.id, parseRecipeId(recipeId));
  revalidatePath("/recipes");
}

export async function removeRecipeAction(recipeId: string): Promise<void> {
  const user = await getVerifiedUser();
  await removeRecipeAccessForUser(user.id, parseRecipeId(recipeId));
  revalidatePath("/recipes");
}

export async function cloneRecipeAction(
  recipeId: string,
): Promise<RecipeSummary> {
  const user = await getVerifiedUser();
  const recipe = await cloneRecipeForUser(user.id, parseRecipeId(recipeId));
  revalidatePath("/recipes");
  return recipe;
}

export async function addRecipeToListAction(
  recipeId: string,
  listId: string,
  options: {
    targetServings: number;
    selectedIngredientIds: string[];
  },
): Promise<AddToListResult> {
  const user = await getVerifiedUser();
  const list = parseListId(listId);
  const result = await addRecipeIngredientsToListForUser(
    user.id,
    parseRecipeId(recipeId),
    list,
    parseAddRecipeToListOptions(options),
  );
  revalidatePath(`/lists/${list}`);
  return result;
}

export async function fetchListsForRecipeAction(): Promise<ListSummary[]> {
  const user = await getVerifiedUser();
  return fetchListSummariesForUser(user.id);
}

export async function uploadRecipePhotoAction(
  recipeId: string,
  formData: FormData,
): Promise<RecipePhotoResult> {
  const user = await getVerifiedUser();
  const id = parseRecipeId(recipeId);
  const file = formData.get("photo");
  if (!(file instanceof Blob) || file.size === 0) {
    throw new Error("No photo provided");
  }
  const result = await uploadRecipePhotoForUser(user.id, id, file);
  invalidatePrefetchedRecipeDetail(id);
  invalidatePrefetchedRecipes();
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  return result;
}

export async function removeRecipePhotoAction(recipeId: string): Promise<void> {
  const user = await getVerifiedUser();
  const id = parseRecipeId(recipeId);
  await removeRecipePhotoForUser(user.id, id);
  invalidatePrefetchedRecipeDetail(id);
  invalidatePrefetchedRecipes();
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
}

export async function importRecipeFromUrlAction(
  rawUrl: string,
): Promise<RecipeInput> {
  await getVerifiedUser();

  let url: string;
  try {
    url = normalizeImportUrl(rawUrl);
  } catch {
    throw new AppError(RECIPE_IMPORT_ERROR_CODES.invalidUrl);
  }

  let html: string;
  try {
    html = await fetchRecipeHtml(url);
  } catch (cause) {
    throw new AppError(RECIPE_IMPORT_ERROR_CODES.fetchFailed, cause);
  }

  const mapped = mapHtmlToRecipeInput(html, url);
  if (!mapped || (!mapped.title.trim() && mapped.ingredients.length === 0)) {
    throw new AppError(RECIPE_IMPORT_ERROR_CODES.noRecipeFound);
  }

  // Ensure create validation passes even when title was empty but ingredients exist
  if (!mapped.title.trim()) {
    mapped.title = "Imported recipe";
  }

  return parseRecipeInput(mapped);
}
