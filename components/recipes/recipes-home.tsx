"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  FloatingCreateDock,
  floatingDockScrollPadding,
} from "@/components/layout/floating-create-dock";
import { HomeHeader } from "@/components/layout/home-header";
import { AppNav } from "@/components/nav/app-nav";
import { SwipeRow } from "@/components/ui/swipe-row";
import { PlusIcon } from "@/components/ui/icons";
import {
  deleteRecipeAction,
  fetchRecipesAction,
  removeRecipeAction,
} from "@/lib/recipes/actions";
import type { RecipeSummary } from "@/lib/recipes/types";
import { profileGreeting } from "@/lib/profile/types";
import { Button } from "@/components/ui/button";

type RecipesHomeProps = {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  initialRecipes?: RecipeSummary[];
};

export function RecipesHome({
  firstName,
  lastName,
  displayName,
  email,
  initialRecipes = [],
}: RecipesHomeProps) {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeSummary[]>(initialRecipes);
  const greeting = profileGreeting({ firstName, lastName, displayName }, email);

  const loadRecipes = useCallback(async () => {
    const data = await fetchRecipesAction();
    setRecipes(data);
  }, []);

  useEffect(() => {
    void loadRecipes();
  }, [loadRecipes]);

  async function handleRemoveRecipe(recipe: RecipeSummary) {
    if (recipe.isOwner) {
      await deleteRecipeAction(recipe.id);
    } else {
      await removeRecipeAction(recipe.id);
    }
    setRecipes((prev) => prev.filter((entry) => entry.id !== recipe.id));
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-1 flex-col overflow-hidden">
      <HomeHeader greeting={greeting} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div
            className={`flex flex-col gap-4 p-4 ${floatingDockScrollPadding()}`}
          >
            <AppNav active="recipes" />

            {recipes.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                No recipes yet. Create your first recipe below.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recipes.map((recipe) => (
                  <li key={recipe.id}>
                    <SwipeRow
                      requireConfirm
                      confirmMessage={
                        recipe.isOwner
                          ? `Delete "${recipe.title}"? This cannot be undone.`
                          : `Remove "${recipe.title}" from your recipes?`
                      }
                      deleteLabel={recipe.isOwner ? "Delete" : "Remove"}
                      onDelete={() => handleRemoveRecipe(recipe)}
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/recipes/${recipe.id}`)}
                        className="flex w-full items-center justify-between border border-[var(--border)] px-4 py-4 text-left transition-colors active:bg-[var(--muted)]"
                      >
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-[var(--foreground)]">
                            {recipe.title}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {recipe.defaultServings} servings
                            {!recipe.isOwner ? " · shared" : ""}
                          </span>
                        </div>
                        <span className="text-[var(--muted-foreground)]">
                          ›
                        </span>
                      </button>
                    </SwipeRow>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <FloatingCreateDock>
        <Button fullWidth onClick={() => router.push("/recipes/new")}>
          <PlusIcon className="h-4 w-4 shrink-0" />
          New recipe
        </Button>
      </FloatingCreateDock>
    </div>
  );
}
