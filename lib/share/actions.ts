"use server";

import { getVerifiedUser } from "@/lib/auth/get-user";
import { parseListId, parseRecipeId, parseShareToken } from "@/lib/validation/parse";
import {
  createShareLinkForList,
  createShareLinkForRecipe,
  fetchListMembersForUser,
  joinListViaToken,
} from "@/lib/share/server";
import type { ListMemberRow, ShareLinkResult } from "@/lib/share/types";
import { revalidatePath } from "next/cache";

export async function createShareLinkAction(
  listId: string,
): Promise<ShareLinkResult> {
  const user = await getVerifiedUser();
  return createShareLinkForList(user.id, listId);
}

export async function createRecipeShareLinkAction(
  recipeId: string,
): Promise<ShareLinkResult> {
  const user = await getVerifiedUser();
  return createShareLinkForRecipe(user.id, parseRecipeId(recipeId));
}

export async function joinListAction(token: string): Promise<string> {
  const user = await getVerifiedUser();
  const listId = await joinListViaToken(user.id, parseShareToken(token));
  revalidatePath("/home");
  revalidatePath(`/lists/${listId}`);
  return listId;
}

export async function fetchListMembersAction(
  listId: string,
): Promise<ListMemberRow[]> {
  const user = await getVerifiedUser();
  return fetchListMembersForUser(user.id, parseListId(listId));
}
