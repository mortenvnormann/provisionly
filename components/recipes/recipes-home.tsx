"use client";


import { useAppNavigate } from "@/lib/nav/use-app-navigate";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRegisterDock } from "@/components/layout/dock-context";
import { HomeHeader } from "@/components/layout/home-header";
import { LoadingState } from "@/components/ui/loading-state";
import { SwipeRow } from "@/components/ui/swipe-row";
import { ChevronRightIcon } from "@/components/ui/icons";
import {
  deleteRecipeAction,
  removeRecipeAction,
} from "@/lib/recipes/actions";
import { prefetchRecipeDetailData } from "@/lib/recipes/recipe-detail-prefetch-cache";
import type { RecipeSummary } from "@/lib/recipes/types";
import { profileGreeting } from "@/lib/profile/types";
import {
  getPrefetchedRecipes,
  prefetchRecipesData,
} from "@/lib/tabs/recipes-prefetch-cache";
import { useTranslations } from "next-intl";

type SortMode = "recent" | "alpha";

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
  const { push } = useAppNavigate();
  const tRecipes = useTranslations("recipes");
  const tCommon = useTranslations("common");
  const initial = resolveInitialRecipes(initialRecipes);
  const [recipes, setRecipes] = useState<RecipeSummary[]>(initial.recipes);
  const [loading, setLoading] = useState(initial.loading);
  const [showContent, setShowContent] = useState(!initial.loading);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const prefetchedRecipesRef = useRef(new Set<string>());
  const greetingName = profileGreeting({ firstName, lastName, displayName }, email);

  const prefetchRecipeDetail = useCallback(
    (recipeId: string) => {
      if (prefetchedRecipesRef.current.has(recipeId)) return;
      prefetchedRecipesRef.current.add(recipeId);
      router.prefetch(`/recipes/${recipeId}`);
      void prefetchRecipeDetailData(recipeId);
    },
    [router],
  );

  const sortedRecipes = useMemo(() => {
    const copy = [...recipes];
    if (sortMode === "alpha") {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      copy.sort((a, b) =>
        (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
      );
    }
    return copy;
  }, [recipes, sortMode]);

  const handleSort = useCallback(() => {
    setSortMode((mode) => (mode === "recent" ? "alpha" : "recent"));
  }, []);

  const handleAdd = useCallback(() => {
    router.push("/recipes/new");
  }, [router]);

  const dockHandlers = useMemo(
    () => ({
      sortVisible: true,
      sortActive: sortMode === "alpha",
      onSort: handleSort,
      addVisible: true,
      onAdd: handleAdd,
    }),
    [handleAdd, handleSort, sortMode],
  );

  useRegisterDock(dockHandlers);

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
          <div className="flex flex-col gap-4 p-4 pb-dock">
            {loading ? (
              <LoadingState label={tRecipes("loadingRecipes")} />
            ) : (
              <div className={contentClass}>
                {recipes.length === 0 ? (
                  <p className="font-ui py-8 text-center text-sm text-[var(--muted-foreground)]">
                    {tRecipes("noRecipes")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {sortedRecipes.map((recipe) => (
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
                          <button
                            type="button"
                            onPointerEnter={() => prefetchRecipeDetail(recipe.id)}
                            onTouchStart={() => prefetchRecipeDetail(recipe.id)}
                            onClick={(event) =>
                              push(`/recipes/${recipe.id}`, {
                                element: event.currentTarget,
                                transitionType: "nav-up",
                              })
                            }
                            className="font-reading shadow-token-sm pressable flex w-full items-center justify-between rounded-2xl bg-[var(--surface)] px-4 py-4 text-left"
                          >
                            <div className="min-w-0">
                              <span className="block truncate font-medium text-[var(--foreground)]">
                                {recipe.title}
                              </span>
                              <span className="font-ui text-xs text-[var(--muted-foreground)]">
                                {tRecipes("servingsCount", {
                                  count: recipe.defaultServings,
                                })}
                                {!recipe.isOwner
                                  ? ` · ${tCommon("shared")}`
                                  : ""}
                              </span>
                            </div>
                            <ChevronRightIcon className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                          </button>
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
    </div>
  );
}
