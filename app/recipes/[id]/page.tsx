import { notFound, redirect } from "next/navigation";
import { RecipeDetailView } from "@/components/recipes/recipe-detail";
import { getSessionState } from "@/lib/auth/session";
import { fetchRecipeDetailForUser } from "@/lib/recipes/server";

type RecipePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ joined?: string }>;
};

export default async function RecipePage({ params, searchParams }: RecipePageProps) {
  const { id } = await params;
  const { joined } = await searchParams;
  const { user } = await getSessionState();

  if (!user) redirect("/login");

  try {
    const recipe = await fetchRecipeDetailForUser(user.id, id);
    return (
      <RecipeDetailView recipe={recipe} showJoinedBanner={joined === "1"} />
    );
  } catch {
    notFound();
  }
}
