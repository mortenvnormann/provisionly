import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { TabsDataProvider } from "@/components/layout/tabs-data-context";
import { getSessionState } from "@/lib/auth/session";
import { fetchListSummariesForUser } from "@/lib/lists/server";
import { createServiceClient } from "@/lib/supabase/service";

export default async function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isGuest, isAuthenticated } = await getSessionState();

  if (!isAuthenticated && !isGuest) {
    redirect("/login");
  }

  let firstName: string | null = null;
  let lastName: string | null = null;
  let displayName: string | null = null;
  let initialLists: Awaited<ReturnType<typeof fetchListSummariesForUser>> = [];
  let initialRecipes: Awaited<
    ReturnType<
      typeof import("@/lib/recipes/server").fetchRecipeSummariesForUser
    >
  > = [];

  // Guests never need the service-role client or recipe prefetch.
  if (user && !isGuest) {
    const headerStore = await headers();
    const pathname = headerStore.get("x-pathname") ?? "/home";
    const prefetchRecipes = pathname.startsWith("/recipes");

    const service = createServiceClient();
    const [{ data: profile }, lists, recipes] = await Promise.all([
      service
        .from("profiles")
        .select("first_name, last_name, display_name")
        .eq("id", user.id)
        .maybeSingle(),
      fetchListSummariesForUser(user.id).catch(() => []),
      prefetchRecipes
        ? import("@/lib/recipes/server")
            .then((m) => m.fetchRecipeSummariesForUser(user.id))
            .catch(() => [])
        : Promise.resolve([]),
    ]);
    firstName = profile?.first_name ?? null;
    lastName = profile?.last_name ?? null;
    displayName = profile?.display_name ?? null;
    initialLists = lists;
    initialRecipes = recipes;
  }

  return (
    <TabsDataProvider
      value={{
        isGuest,
        firstName,
        lastName,
        displayName,
        email: user?.email ?? null,
        initialLists,
        initialRecipes,
      }}
    >
      {children}
    </TabsDataProvider>
  );
}
