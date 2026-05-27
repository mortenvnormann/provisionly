import { notFound, redirect } from "next/navigation";
import { ListDetail } from "@/components/lists/list-detail";
import { getSessionState } from "@/lib/auth/session";
import {
  fetchListAccessForUser,
  fetchListItemsForUser,
  fetchListSettingsForUser,
  fetchListTitleForUser,
} from "@/lib/lists/server";
import { fetchListMembersForUser } from "@/lib/share/server";
import { createServiceClient } from "@/lib/supabase/service";

type ListPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ joined?: string }>;
};

export default async function ListPage({ params, searchParams }: ListPageProps) {
  const { id } = await params;
  const { joined } = await searchParams;
  const { user, isGuest, isAuthenticated } = await getSessionState();

  if (!isAuthenticated && !isGuest) {
    redirect("/login");
  }

  let initialTitle: string | undefined;
  let initialItems: Awaited<ReturnType<typeof fetchListItemsForUser>> | undefined;
  let initialMembers: Awaited<ReturnType<typeof fetchListMembersForUser>> | undefined;
  let isOwner = true;
  let locale = "en";
  let groupByCategory = true;

  if (isGuest) {
    initialTitle = undefined;
  } else if (user) {
    try {
      const title = await fetchListTitleForUser(user.id, id);
      if (!title) notFound();
      initialTitle = title;
      const [items, settings, members, access] = await Promise.all([
        fetchListItemsForUser(user.id, id),
        fetchListSettingsForUser(user.id, id),
        fetchListMembersForUser(user.id, id),
        fetchListAccessForUser(user.id, id),
      ]);
      initialItems = items;
      initialMembers = members;
      isOwner = access.isOwner;
      groupByCategory = settings.groupByCategory;

      const service = createServiceClient();
      const { data: profile } = await service
        .from("profiles")
        .select("locale")
        .eq("id", user.id)
        .maybeSingle();
      locale = profile?.locale ?? "en";
    } catch {
      notFound();
    }
  }

  return (
    <ListDetail
      listId={id}
      isGuest={isGuest}
      initialTitle={initialTitle}
      initialItems={initialItems}
      initialMembers={initialMembers}
      currentUserId={user?.id}
      isOwner={isOwner}
      showJoinedBanner={joined === "1"}
      locale={locale}
      initialGroupByCategory={groupByCategory}
    />
  );
}
