"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createRecipeAction } from "@/lib/recipes/actions";
import { useTranslations } from "next-intl";

const RecipeForm = dynamic(
  () =>
    import("@/components/recipes/recipe-form").then((m) => ({
      default: m.RecipeForm,
    })),
  { ssr: false },
);

export function NewRecipeForm() {
  const tRecipes = useTranslations("recipes");
  const router = useRouter();

  return (
    <RecipeForm
      submitLabel={tRecipes("createRecipe")}
      onSubmit={async (input) => {
        const recipe = await createRecipeAction(input);
        router.push(`/recipes/${recipe.id}`);
        router.refresh();
      }}
    />
  );
}
