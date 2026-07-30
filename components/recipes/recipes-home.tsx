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
  importRecipeFromUrlAction,
  removeRecipeAction,
} from "@/lib/recipes/actions";
import { setRecipeImportDraft } from "@/lib/recipes/import-draft-cache";
import { getAppErrorCode } from "@/lib/errors/app-error";
import { RECIPE_IMPORT_ERROR_CODES } from "@/lib/errors/recipe-import-codes";
import { Button } from "@/components/ui/button";
import { prefetchRecipeDetailData } from "@/lib/recipes/recipe-detail-prefetch-cache";
import type { RecipeSummary } from "@/lib/recipes/types";
import {
  formatRecipeMinutes,
  totalRecipeMinutes,
} from "@/lib/recipes/timing";
import { profileGreeting } from "@/lib/profile/types";
import {
  getPrefetchedRecipes,
  prefetchRecipesData,
} from "@/lib/tabs/recipes-prefetch-cache";
import { useTranslations } from "next-intl";

type SortMode = "recent" | "alpha";
type AddPanel = "closed" | "menu" | "import";

type RecipesHomeProps = {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  initialRecipes?: RecipeSummary[];
};

function recipeCardMeta(
  recipe: RecipeSummary,
  tRecipes: ReturnType<typeof useTranslations<"recipes">>,
  tCommon: ReturnType<typeof useTranslations<"common">>,
): string {
  const parts = [
    tRecipes("servingsCount", { count: recipe.defaultServings }),
  ];
  const total = totalRecipeMinutes(recipe.prepMinutes, recipe.cookMinutes);
  if (total != null) {
    parts.push(
      formatRecipeMinutes(total, {
        formatMinutes: (count) => tRecipes("minutesShort", { count }),
        formatHoursMinutes: (hours, minutes) =>
          tRecipes("hoursMinutesShort", { hours, minutes }),
      }),
    );
  }
  if (!recipe.isOwner) {
    parts.push(tCommon("shared"));
  }
  return parts.join(" · ");
}

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
  const [addPanel, setAddPanel] = useState<AddPanel>("closed");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
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

  const closeAddPanel = useCallback(() => {
    setAddPanel("closed");
    setImportUrl("");
    setImportError(null);
    setImporting(false);
  }, []);

  const handleAdd = useCallback(() => {
    setAddPanel((current) => (current === "closed" ? "menu" : "closed"));
    setImportError(null);
  }, []);

  const handleManual = useCallback(() => {
    closeAddPanel();
    router.push("/recipes/new");
  }, [closeAddPanel, router]);

  const handleImportSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const trimmed = importUrl.trim();
      if (!trimmed || importing) return;

      setImporting(true);
      setImportError(null);
      try {
        const draft = await importRecipeFromUrlAction(trimmed);
        setRecipeImportDraft(draft);
        closeAddPanel();
        router.push("/recipes/new");
      } catch (err) {
        console.error(err);
        const code = getAppErrorCode(err);
        if (code === RECIPE_IMPORT_ERROR_CODES.invalidUrl) {
          setImportError(tRecipes("importInvalidUrl"));
        } else if (code === RECIPE_IMPORT_ERROR_CODES.noRecipeFound) {
          setImportError(tRecipes("importNoRecipeFound"));
        } else {
          setImportError(tRecipes("importFetchFailed"));
        }
      } finally {
        setImporting(false);
      }
    },
    [closeAddPanel, importUrl, importing, router, tRecipes],
  );

  const dockHandlers = useMemo(
    () => ({
      sortVisible: true,
      sortActive: sortMode === "alpha",
      onSort: handleSort,
      addVisible: true,
      onAdd: handleAdd,
      createFormOpen: addPanel !== "closed",
    }),
    [addPanel, handleAdd, handleSort, sortMode],
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
          <div className="flex flex-col gap-3 px-4 pt-4 pb-dock">
            {loading ? (
              <LoadingState label={tRecipes("loadingRecipes")} />
            ) : (
              <div className={contentClass}>
                {recipes.length === 0 ? (
                  <p className="font-ui py-8 text-center text-sm text-[var(--muted-foreground)]">
                    {tRecipes("noRecipes")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2.5">
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
                            className="font-ui card-surface pressable flex w-full items-center justify-between px-3.5 py-3 text-left"
                          >
                            <div className="min-w-0">
                              <span className="block truncate text-[15px] font-medium text-[var(--foreground)]">
                                {recipe.title}
                              </span>
                              <span className="font-ui text-xs text-[var(--muted-foreground)]">
                                {recipeCardMeta(recipe, tRecipes, tCommon)}
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

      {addPanel === "menu" ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--dock-height)+env(safe-area-inset-bottom,0px)+0.75rem)] z-[60] mx-auto w-full max-w-lg px-4 pb-2">
          <div className="pointer-events-auto ml-auto w-44">
            <div
              className="card-surface-bordered font-ui overflow-hidden py-1 shadow-token-md"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAddPanel("import");
                  setImportError(null);
                }}
                className="pressable w-full px-3 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                {tRecipes("importUrl")}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleManual}
                className="pressable w-full px-3 py-2.5 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                {tRecipes("createManual")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addPanel === "import" ? (
        <div className="font-ui fixed inset-x-0 bottom-[calc(var(--dock-height)+env(safe-area-inset-bottom,0px)+0.75rem)] z-[60] mx-auto w-full max-w-lg px-4 pb-2">
          <form
            onSubmit={(event) => void handleImportSubmit(event)}
            className="card-surface-bordered p-3 shadow-token-md"
          >
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              {tRecipes("importUrlLabel")}
            </label>
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder={tRecipes("importUrlPlaceholder")}
              autoFocus
              disabled={importing}
              className="font-ui h-10 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--background)] px-3 text-base focus:border-[var(--focus-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]/20"
            />
            {importError ? (
              <p
                className="mt-2 text-sm text-[var(--destructive)]"
                role="alert"
              >
                {importError}
              </p>
            ) : null}
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={importing}
                onClick={closeAddPanel}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                fullWidth
                disabled={importing || !importUrl.trim()}
              >
                {importing ? tRecipes("importing") : tRecipes("importConfirm")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
