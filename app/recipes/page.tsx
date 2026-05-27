import { redirect } from "next/navigation";
import { RecipesHome } from "@/components/recipes/recipes-home";
import { getSessionState } from "@/lib/auth/session";
import { fetchRecipeSummariesForUser } from "@/lib/recipes/server";
import { createServiceClient } from "@/lib/supabase/service";

export default async function RecipesPage() {
  const { user } = await getSessionState();

  if (!user) redirect("/login");

  const service = createServiceClient();
  const [{ data: profile }, recipes] = await Promise.all([
    service
      .from("profiles")
      .select("first_name, last_name, display_name")
      .eq("id", user.id)
      .maybeSingle(),
    fetchRecipeSummariesForUser(user.id).catch(() => []),
  ]);

  return (
    <RecipesHome
      firstName={profile?.first_name ?? null}
      lastName={profile?.last_name ?? null}
      displayName={profile?.display_name ?? null}
      email={user.email ?? null}
      initialRecipes={recipes}
    />
  );
}
