"use client";

import { useRouter } from "next/navigation";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { BackLink } from "@/components/ui/back-link";
import { createRecipeAction } from "@/lib/recipes/actions";
import { useTranslations } from "next-intl";

export default function NewRecipePage() {
  const tCommon = useTranslations("common");
  const tRecipes = useTranslations("recipes");
  const router = useRouter();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-[var(--border)] px-2 py-3">
        <BackLink href="/recipes" label={tCommon("back")} />
        <h1 className="text-lg font-semibold text-[var(--foreground)]">
          {tRecipes("newRecipeTitle")}
        </h1>
      </header>
      <div className="p-4">
        <RecipeForm
          submitLabel={tRecipes("createRecipe")}
          onSubmit={async (input) => {
            const recipe = await createRecipeAction(input);
            router.push(`/recipes/${recipe.id}`);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
