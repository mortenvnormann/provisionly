import { getTranslations } from "next-intl/server";
import { NewRecipeForm } from "@/components/recipes/new-recipe-form";
import { BackLink } from "@/components/ui/back-link";

export default async function NewRecipePage() {
  const tCommon = await getTranslations("common");
  const tRecipes = await getTranslations("recipes");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-2 py-3">
        <BackLink href="/recipes" label={tCommon("back")} />
        <h1 className="text-lg font-semibold text-[var(--foreground)]">
          {tRecipes("newRecipeTitle")}
        </h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <NewRecipeForm />
      </div>
    </div>
  );
}
