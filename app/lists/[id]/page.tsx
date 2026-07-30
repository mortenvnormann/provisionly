import { redirect } from "next/navigation";
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

  const pageData = await fetchListPageData(user.id, id).catch(() => null);

  return (
    <ListDetail
      listId={id}
      isGuest={false}
      currentUserId={user.id}
      initialTitle={pageData?.title}
      initialItems={pageData?.items}
      initialMembers={pageData?.members}
      isOwner={pageData?.isOwner}
      locale={pageData?.locale}
      initialGroupByCategory={pageData?.groupByCategory}
      initialCategories={pageData?.categories}
      showJoinedBanner={joined === "1"}
    />
  );
}
