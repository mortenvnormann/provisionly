import { redirect } from "next/navigation";
import { ListsHome } from "@/components/lists/lists-home";
import { getSessionState } from "@/lib/auth/session";
import { fetchListSummariesForUser } from "@/lib/lists/server";
import { createServiceClient } from "@/lib/supabase/service";

export default async function HomePage() {
  const { user, isGuest, isAuthenticated } = await getSessionState();

  if (!isAuthenticated && !isGuest) {
    redirect("/login");
  }

  let firstName: string | null = null;
  let lastName: string | null = null;
  let displayName: string | null = null;
  let initialLists: Awaited<ReturnType<typeof fetchListSummariesForUser>> = [];

  if (user) {
    const service = createServiceClient();
    const [{ data: profile }, lists] = await Promise.all([
      service
        .from("profiles")
        .select("first_name, last_name, display_name")
        .eq("id", user.id)
        .maybeSingle(),
      fetchListSummariesForUser(user.id).catch(() => []),
    ]);
    firstName = profile?.first_name ?? null;
    lastName = profile?.last_name ?? null;
    displayName = profile?.display_name ?? null;
    initialLists = lists;
  }

  return (
    <ListsHome
      isGuest={isGuest}
      firstName={firstName}
      lastName={lastName}
      displayName={displayName}
      email={user?.email ?? null}
      initialLists={initialLists}
    />
  );
}
