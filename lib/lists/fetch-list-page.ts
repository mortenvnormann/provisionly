import "server-only";

import type { ListItemRow } from "@/lib/lists/types";
import type { ListMemberRow } from "@/lib/share/types";
import { createServiceClient } from "@/lib/supabase/service";

export type ListPageData = {
  title: string;
  items: ListItemRow[];
  members: ListMemberRow[];
  isOwner: boolean;
  groupByCategory: boolean;
  locale: string;
};

async function assertListAccessOnce(
  userId: string,
  listId: string,
): Promise<void> {
  const service = createServiceClient();
  const [{ data: owned }, { data: membership }] = await Promise.all([
    service.from("lists").select("id").eq("id", listId).eq("owner_id", userId).maybeSingle(),
    service
      .from("list_members")
      .select("list_id")
      .eq("list_id", listId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!owned && !membership) {
    throw new Error("List not found");
  }
}

export async function fetchListPageData(
  userId: string,
  listId: string,
): Promise<ListPageData | null> {
  await assertListAccessOnce(userId, listId);
  const service = createServiceClient();

  const [
    { data: list, error: listError },
    { data: items, error: itemsError },
    { data: members, error: membersError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    service
      .from("lists")
      .select("title, owner_id, group_by_category")
      .eq("id", listId)
      .maybeSingle(),
    service
      .from("list_items")
      .select(
        "id, list_id, name_original, quantity, unit, category_id, checked, sort_key",
      )
      .eq("list_id", listId)
      .order("sort_key"),
    service.from("list_members").select("user_id, role").eq("list_id", listId),
    service.from("profiles").select("locale").eq("id", userId).maybeSingle(),
  ]);

  if (listError) throw new Error(listError.message);
  if (!list) return null;
  if (itemsError) throw new Error(itemsError.message);
  if (membersError) throw new Error(membersError.message);
  if (profileError) throw new Error(profileError.message);

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  let memberRows: ListMemberRow[] = [];

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await service
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    if (profilesError) throw new Error(profilesError.message);

    const nameById = new Map(
      (profiles ?? []).map((p) => [p.id, p.display_name ?? "Member"]),
    );

    memberRows = (members ?? [])
      .map((member) => ({
        userId: member.user_id,
        displayName: nameById.get(member.user_id) ?? "Member",
        role: member.role,
        isOwner: member.user_id === list.owner_id,
      }))
      .sort((a, b) => {
        if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
        return a.displayName.localeCompare(b.displayName);
      });
  }

  return {
    title: list.title,
    items: (items ?? []).map((row) => ({
      id: row.id,
      listId: row.list_id,
      name: row.name_original,
      quantity: row.quantity,
      unit: row.unit,
      categoryId: row.category_id,
      checked: row.checked,
      sortKey: row.sort_key,
    })),
    members: memberRows,
    isOwner: list.owner_id === userId,
    groupByCategory: list.group_by_category ?? true,
    locale: profile?.locale ?? "en",
  };
}
