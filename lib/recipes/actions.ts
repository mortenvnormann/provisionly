"use server";

import { revalidatePath } from "next/cache";
import { getVerifiedUser } from "@/lib/auth/get-user";
import { fetchListSummariesForUser } from "@/lib/lists/server";
import type { ListSummary } from "@/lib/lists/types";
import {
  addRecipeIngredientsToListForUser,
  cloneRecipeForUser,
  createRecipeForUser,
  deleteRecipeForUser,
  fetchRecipeDetailForUser,
  fetchRecipeSummariesForUser,
  removeRecipeAccessForUser,
  updateRecipeForUser,
} from "@/lib/recipes/server";
import type {
  AddToListResult,
  RecipeDetail,
  RecipeInput,
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
  return fetchRecipeDetailForUser(user.id, recipeId);
}

export async function createRecipeAction(
  input: RecipeInput,
): Promise<RecipeSummary> {
  const user = await getVerifiedUser();
  const recipe = await createRecipeForUser(user.id, input);
  revalidatePath("/recipes");
  return recipe;
}

export async function updateRecipeAction(
  recipeId: string,
  input: RecipeInput,
): Promise<void> {
  const user = await getVerifiedUser();
  await updateRecipeForUser(user.id, recipeId, input);
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
}

export async function deleteRecipeAction(recipeId: string): Promise<void> {
  const user = await getVerifiedUser();
  await deleteRecipeForUser(user.id, recipeId);
  revalidatePath("/recipes");
}

export async function removeRecipeAction(recipeId: string): Promise<void> {
  const user = await getVerifiedUser();
  await removeRecipeAccessForUser(user.id, recipeId);
  revalidatePath("/recipes");
}

export async function cloneRecipeAction(
  recipeId: string,
): Promise<RecipeSummary> {
  const user = await getVerifiedUser();
  const recipe = await cloneRecipeForUser(user.id, recipeId);
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
  const result = await addRecipeIngredientsToListForUser(
    user.id,
    recipeId,
    listId,
    options,
  );
  revalidatePath(`/lists/${listId}`);
  return result;
}

export async function fetchListsForRecipeAction(): Promise<ListSummary[]> {
  const user = await getVerifiedUser();
  return fetchListSummariesForUser(user.id);
}
