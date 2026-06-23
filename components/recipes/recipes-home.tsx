"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  FloatingCreateDock,
  floatingDockScrollPadding,
} from "@/components/layout/floating-create-dock";
import { HomeHeader } from "@/components/layout/home-header";
import { AppNav } from "@/components/nav/app-nav";
import { LoadingState } from "@/components/ui/loading-state";
import { SwipeRow } from "@/components/ui/swipe-row";
import { PlusIcon } from "@/components/ui/icons";
import {
  deleteRecipeAction,
  removeRecipeAction,
} from "@/lib/recipes/actions";
import type { RecipeSummary } from "@/lib/recipes/types";
import { profileGreeting } from "@/lib/profile/types";
import {
  getPrefetchedRecipes,
  prefetchRecipesData,
} from "@/lib/tabs/recipes-prefetch-cache";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type RecipesHomeProps = {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  initialRecipes?: RecipeSummary[];
};

function resolveInitialRecipes(initialRecipes: RecipeSummary[]): {
  recipes: RecipeSummary[];
  loading: boolean;
} {
  if (initialRecipes.length > 0) {
    return { recipes: initialRecipes, loading: false };
  }

  const cached = getPrefetchedRecipes();
  if (cached) {
    return { recipes: cached, loading: false };
  }

  return { recipes: [], loading: true };
}

export function RecipesHome({
  firstName,
  lastName,
  displayName,
  email,
  initialRecipes = [],
}: RecipesHomeProps) {
  const router = useRouter();
  const tRecipes = useTranslations("recipes");
  const tCommon = useTranslations("common");
  const initial = resolveInitialRecipes(initialRecipes);
  const [recipes, setRecipes] = useState<RecipeSummary[]>(initial.recipes);
  const [loading, setLoading] = useState(initial.loading);
  const [showContent, setShowContent] = useState(!initial.loading);
  const [reduceMotion, setReduceMotion] = useState(false);
  const greetingName = profileGreeting({ firstName, lastName, displayName }, email);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const revealContent = useCallback(() => {
    if (reduceMotion) {
      setShowContent(true);
      return;
    }
    requestAnimationFrame(() => setShowContent(true));
  }, [reduceMotion]);

  useEffect(() => {
    if (initialRecipes.length > 0) return;

    let cancelled = false;

    async function load() {
      const cached = getPrefetchedRecipes();
      if (cached) {
        if (cancelled) return;
        setRecipes(cached);
        setLoading(false);
        revealContent();
        return;
      }

      setLoading(true);
      setShowContent(false);
      try {
        const data = await prefetchRecipesData();
        if (cancelled) return;
        setRecipes(data);
        setLoading(false);
        revealContent();
      } catch {
        if (!cancelled) {
          setLoading(false);
          revealContent();
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [initialRecipes.length, revealContent]);

  async function handleRemoveRecipe(recipe: RecipeSummary) {
    if (recipe.isOwner) {
      await deleteRecipeAction(recipe.id);
    } else {
      await removeRecipeAction(recipe.id);
    }
    setRecipes((prev) => prev.filter((entry) => entry.id !== recipe.id));
    router.refresh();
  }

  const contentClass = [
    reduceMotion ? "" : "transition-opacity duration-200 ease-out",
    showContent ? "opacity-100" : "opacity-0",
  ].join(" ");

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <HomeHeader greetingName={greetingName} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div
            className={`flex flex-col gap-4 p-4 ${floatingDockScrollPadding()}`}
          >
            <AppNav />

            {loading ? (
              <LoadingState label={tRecipes("loadingRecipes")} />
            ) : (
              <div className={contentClass}>
                {recipes.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                    {tRecipes("noRecipes")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {recipes.map((recipe) => (
                      <li key={recipe.id}>
                        <SwipeRow
                          requireConfirm
                          confirmMessage={
                            recipe.isOwner
                              ? tRecipes("deleteRecipeConfirm", {
                                  title: recipe.title,
                                })
                              : tRecipes("removeRecipeConfirm", {
                                  title: recipe.title,
                                })
                          }
                          deleteLabel={
                            recipe.isOwner
                              ? tCommon("delete")
                              : tCommon("remove")
                          }
                          onDelete={() => handleRemoveRecipe(recipe)}
                        >
                          <Link
                            href={`/recipes/${recipe.id}`}
                            className="flex w-full items-center justify-between border border-[var(--border)] px-4 py-4 text-left transition-colors active:bg-[var(--muted)]"
                          >
                            <div className="min-w-0">
                              <span className="block truncate font-medium text-[var(--foreground)]">
                                {recipe.title}
                              </span>
                              <span className="text-xs text-[var(--muted-foreground)]">
                                {tRecipes("servingsCount", {
                                  count: recipe.defaultServings,
                                })}
                                {!recipe.isOwner
                                  ? ` · ${tCommon("shared")}`
                                  : ""}
                              </span>
                            </div>
                            <span className="text-[var(--muted-foreground)]">
                              ›
                            </span>
                          </Link>
                        </SwipeRow>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <FloatingCreateDock>
        <Button fullWidth onClick={() => router.push("/recipes/new")}>
          <PlusIcon className="h-4 w-4 shrink-0" />
          {tRecipes("newRecipe")}
        </Button>
      </FloatingCreateDock>
    </div>
  );
}
