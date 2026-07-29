import { redirect } from "next/navigation";
import { RecipeDetailView } from "@/components/recipes/recipe-detail";
import { getSessionState } from "@/lib/auth/session";

type RecipePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ joined?: string }>;
};

export default async function RecipePage({ params, searchParams }: RecipePageProps) {
  const { id } = await params;
  const { joined } = await searchParams;
  const { user } = await getSessionState();

  if (!user) redirect("/login");

  return (
    <RecipeDetailView
      recipeId={id}
      showJoinedBanner={joined === "1"}
    />
  );
}
