import { notFound, redirect } from "next/navigation";
import { ListDetail } from "@/components/lists/list-detail";
import { getSessionState } from "@/lib/auth/session";
import { getLocaleCookie } from "@/lib/i18n/cookie";
import { fetchListPageData } from "@/lib/lists/fetch-list-page";

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

  if (isGuest) {
    const locale = await getLocaleCookie();
    return (
      <ListDetail
        listId={id}
        isGuest
        showJoinedBanner={joined === "1"}
        locale={locale}
      />
    );
  }

  if (!user) {
    redirect("/login");
  }

  try {
    const data = await fetchListPageData(user.id, id);
    if (!data) notFound();

    return (
      <ListDetail
        listId={id}
        isGuest={false}
        initialTitle={data.title}
        initialItems={data.items}
        initialMembers={data.members}
        currentUserId={user.id}
        isOwner={data.isOwner}
        showJoinedBanner={joined === "1"}
        locale={data.locale}
        initialGroupByCategory={data.groupByCategory}
        initialCategories={data.categories}
      />
    );
  } catch {
    notFound();
  }
}
