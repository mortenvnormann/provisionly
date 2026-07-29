import "server-only";

import { getCategoriesOnly } from "@/lib/categorisation/catalog";
import { getLocaleCookie } from "@/lib/i18n/cookie";
import type { CategoryRow, ListItemRow } from "@/lib/lists/types";
import type { ListMemberRow } from "@/lib/share/types";
import { createServiceClient } from "@/lib/supabase/service";

export type ListPageData = {
  title: string;
  items: ListItemRow[];
  members: ListMemberRow[];
  isOwner: boolean;
  groupByCategory: boolean;
  locale: string;
  categories: CategoryRow[];
};

type MemberQueryRow = {
  user_id: string;
  role: string;
  profiles:
    | { display_name: string | null }
    | { display_name: string | null }[]
    | null;
};

function displayNameFromProfiles(
  profiles: MemberQueryRow["profiles"],
): string {
  if (!profiles) return "Member";
  if (Array.isArray(profiles)) {
    return profiles[0]?.display_name ?? "Member";
  }
  return profiles.display_name ?? "Member";
}

export async function fetchListPageData(
  userId: string,
  listId: string,
): Promise<ListPageData | null> {
  const service = createServiceClient();

  const [
    { data: list, error: listError },
    { data: items, error: itemsError },
    { data: members, error: membersError },
    { data: membership, error: membershipError },
    locale,
    categoriesResult,
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
    service
      .from("list_members")
      .select("user_id, role, profiles(display_name)")
      .eq("list_id", listId),
    service
      .from("list_members")
      .select("list_id")
      .eq("list_id", listId)
      .eq("user_id", userId)
      .maybeSingle(),
    getLocaleCookie(),
    getCategoriesOnly(service).catch(() => ({ categories: [], generalId: "" })),
  ]);

  if (listError) throw new Error(listError.message);
  if (!list) return null;
  if (itemsError) throw new Error(itemsError.message);
  if (membersError) throw new Error(membersError.message);
  if (membershipError) throw new Error(membershipError.message);

  const isOwner = list.owner_id === userId;
  if (!isOwner && !membership) {
    throw new Error("List not found");
  }

  const memberRows: ListMemberRow[] = (members ?? [])
    .map((member: MemberQueryRow) => ({
      userId: member.user_id,
      displayName: displayNameFromProfiles(member.profiles),
      role: member.role,
      isOwner: member.user_id === list.owner_id,
    }))
    .sort((a, b) => {
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      return a.displayName.localeCompare(b.displayName);
    });

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
    isOwner,
    groupByCategory: list.group_by_category ?? true,
    locale,
    categories: categoriesResult.categories,
  };
}
