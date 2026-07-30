import "server-only";

import { buildJoinUrl } from "@/lib/app-url";
import { AppError } from "@/lib/errors/app-error";
import { SHARE_ERROR_CODES } from "@/lib/errors/share-codes";
import { assertListAccess } from "@/lib/lists/server";
import { assertRecipeViewAccess } from "@/lib/recipes/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateShareToken, hashShareToken } from "@/lib/share/tokens";
import type { JoinShareResult, ListMemberRow, ShareLinkResult } from "@/lib/share/types";

/** Invite links expire after 72 hours; joined members keep access. */
const SHARE_LINK_TTL_MS = 72 * 60 * 60 * 1000;

function shareLinkExpiresAt(): string {
  return new Date(Date.now() + SHARE_LINK_TTL_MS).toISOString();
}

export async function createShareLinkForList(
  userId: string,
  listId: string,
): Promise<ShareLinkResult> {
  await assertListAccess(userId, listId);

  const service = createServiceClient();
  const { data: list, error: listError } = await service
    .from("lists")
    .select("id")
    .eq("id", listId)
    .maybeSingle();

  if (listError) throw new Error(listError.message);
  if (!list) throw new Error("List not found");

  const token = generateShareToken();
  const tokenHash = hashShareToken(token);
  const expiresAt = shareLinkExpiresAt();

  const { error } = await service.from("share_links").insert({
    resource_type: "list",
    resource_id: listId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: userId,
  });

  if (error) throw new Error(error.message);

  return {
    url: buildJoinUrl(token),
    expiresAt,
  };
}

export async function createShareLinkForRecipe(
  userId: string,
  recipeId: string,
): Promise<ShareLinkResult> {
  await assertRecipeViewAccess(userId, recipeId);

  const service = createServiceClient();
  const { data: recipe, error: recipeError } = await service
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .maybeSingle();

  if (recipeError) throw new Error(recipeError.message);
  if (!recipe) throw new Error("Recipe not found");

  const token = generateShareToken();
  const tokenHash = hashShareToken(token);
  const expiresAt = shareLinkExpiresAt();

  const { error } = await service.from("share_links").insert({
    resource_type: "recipe",
    resource_id: recipeId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: userId,
  });

  if (error) throw new Error(error.message);

  return {
    url: buildJoinUrl(token),
    expiresAt,
  };
}

export async function joinViaShareToken(
  userId: string,
  token: string,
): Promise<JoinShareResult> {
  const tokenHash = hashShareToken(token);
  const service = createServiceClient();

  const { data: link, error: linkError } = await service
    .from("share_links")
    .select("resource_id, resource_type, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (linkError) throw new AppError(SHARE_ERROR_CODES.invalid, linkError);
  if (!link) throw new AppError(SHARE_ERROR_CODES.invalid);

  if (link.expires_at && new Date(link.expires_at) <= new Date()) {
    throw new AppError(SHARE_ERROR_CODES.expired);
  }

  if (link.resource_type === "list") {
    const listId = link.resource_id;
    const { data: list, error: listError } = await service
      .from("lists")
      .select("id")
      .eq("id", listId)
      .maybeSingle();

    if (listError) throw new AppError(SHARE_ERROR_CODES.invalid, listError);
    if (!list) throw new AppError(SHARE_ERROR_CODES.listGone);

    const { error: memberError } = await service.from("list_members").upsert(
      {
        list_id: listId,
        user_id: userId,
        role: "editor",
      },
      { onConflict: "list_id,user_id", ignoreDuplicates: true },
    );

    if (memberError) throw new AppError(SHARE_ERROR_CODES.invalid, memberError);
    return { type: "list", id: listId };
  }

  if (link.resource_type === "recipe") {
    const recipeId = link.resource_id;
    const { data: recipe, error: recipeError } = await service
      .from("recipes")
      .select("id")
      .eq("id", recipeId)
      .maybeSingle();

    if (recipeError) throw new AppError(SHARE_ERROR_CODES.invalid, recipeError);
    if (!recipe) throw new AppError(SHARE_ERROR_CODES.recipeGone);

    const { error: accessError } = await service.from("recipe_access").upsert(
      {
        recipe_id: recipeId,
        user_id: userId,
      },
      { onConflict: "recipe_id,user_id", ignoreDuplicates: true },
    );

    if (accessError) throw new AppError(SHARE_ERROR_CODES.invalid, accessError);
    return { type: "recipe", id: recipeId };
  }

  throw new AppError(SHARE_ERROR_CODES.invalid);
}

export async function joinListViaToken(
  userId: string,
  token: string,
): Promise<string> {
  const result = await joinViaShareToken(userId, token);
  if (result.type !== "list") {
    throw new AppError(SHARE_ERROR_CODES.invalid);
  }
  return result.id;
}

export async function fetchListMembersForUser(
  userId: string,
  listId: string,
): Promise<ListMemberRow[]> {
  await assertListAccess(userId, listId);
  const service = createServiceClient();

  const [{ data: list }, { data: members, error: membersError }] =
    await Promise.all([
      service.from("lists").select("owner_id").eq("id", listId).single(),
      service
        .from("list_members")
        .select("user_id, role")
        .eq("list_id", listId),
    ]);

  if (membersError) throw new Error(membersError.message);

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  if (userIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await service
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  if (profilesError) throw new Error(profilesError.message);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name ?? "Member"]),
  );

  return (members ?? [])
    .map((member) => ({
      userId: member.user_id,
      displayName: nameById.get(member.user_id) ?? "Member",
      role: member.role,
      isOwner: member.user_id === list?.owner_id,
    }))
    .sort((a, b) => {
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      return a.displayName.localeCompare(b.displayName);
    });
}
