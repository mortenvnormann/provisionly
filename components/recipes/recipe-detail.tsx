"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRegisterDock } from "@/components/layout/dock-context";
import type { RecipeFormHandle } from "@/components/recipes/recipe-form";
import { ProblemPage } from "@/components/layout/problem-page";
import { ServingsScaler } from "@/components/recipes/servings-scaler";
import { RecipePhotoField } from "@/components/recipes/recipe-photo-field";
import { RecipeTiming } from "@/components/recipes/recipe-timing";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import {
  cloneRecipeAction,
  deleteRecipeAction,
  removeRecipeAction,
  updateRecipeAction,
} from "@/lib/recipes/actions";
import { scaleQuantity } from "@/lib/recipes/scale";
import {
  getPrefetchedRecipeDetail,
  prefetchRecipeDetailData,
} from "@/lib/recipes/recipe-detail-prefetch-cache";
import { useRecipeSync } from "@/lib/recipes/use-recipe-sync";
import type { RecipeDetail, RecipeInput } from "@/lib/recipes/types";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { ShareIcon } from "@/components/ui/icons";
import { useTranslations } from "next-intl";

const RecipeForm = dynamic(
  () =>
    import("@/components/recipes/recipe-form").then((m) => ({
      default: m.RecipeForm,
    })),
  { ssr: false },
);

const ShareRecipeSheet = dynamic(
  () =>
    import("@/components/recipes/share-recipe-sheet").then((m) => ({
      default: m.ShareRecipeSheet,
    })),
  { ssr: false },
);

const AddToListSheet = dynamic(
  () =>
    import("@/components/recipes/add-to-list-sheet").then((m) => ({
      default: m.AddToListSheet,
    })),
  { ssr: false },
);

type RecipeDetailViewProps = {
  recipeId: string;
  recipe?: RecipeDetail;
  showJoinedBanner?: boolean;
};

function formatQty(qty: number | null, unit: string | null): string {
  if (qty == null) return unit ?? "";
  return unit ? `${qty} ${unit}` : String(qty);
}

export function RecipeDetailView({
  recipeId,
  recipe: recipeProp,
  showJoinedBanner = false,
}: RecipeDetailViewProps) {
  const tRecipes = useTranslations("recipes");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tShare = useTranslations("share");
  const tAddToList = useTranslations("addToList");
  const router = useRouter();
  const confirmDialog = useConfirm();
  const bootstrapRecipe = recipeProp ?? getPrefetchedRecipeDetail(recipeId);
  const [recipe, setRecipe] = useState<RecipeDetail | null>(bootstrapRecipe);
  const [servings, setServings] = useState(
    bootstrapRecipe?.defaultServings ?? 4,
  );
  const [loading, setLoading] = useState(!bootstrapRecipe);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [joinedBanner, setJoinedBanner] = useState(showJoinedBanner);
  const [cloning, setCloning] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const recipeFormRef = useRef<RecipeFormHandle>(null);

  useEffect(() => {
    if (bootstrapRecipe) {
      setRecipe(bootstrapRecipe);
      setServings(bootstrapRecipe.defaultServings);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void prefetchRecipeDetailData(recipeId)
      .then((data) => {
        if (cancelled) return;
        setRecipe(data);
        setServings(data.defaultServings);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bootstrapRecipe, recipeId]);

  useEffect(() => {
    if (!showJoinedBanner) return;
    const timer = setTimeout(() => setJoinedBanner(false), 5000);
    return () => clearTimeout(timer);
  }, [showJoinedBanner]);

  useRecipeSync({
    recipeId,
    enabled: !!recipe,
    skipInitialSync: !!bootstrapRecipe,
    onRecipeChange: (nextRecipe) => {
      setRecipe(nextRecipe);
      setServings(nextRecipe.defaultServings);
    },
  });

  async function handleUpdate(input: RecipeInput) {
    if (!recipe) return;
    await updateRecipeAction(recipe.id, input);
    setEditing(false);
    router.refresh();
  }

  async function handleClone() {
    if (!recipe) return;
    setCloning(true);
    try {
      const cloned = await cloneRecipeAction(recipe.id);
      router.push(`/recipes/${cloned.id}`);
      router.refresh();
    } finally {
      setCloning(false);
    }
  }

  async function handleDelete() {
    if (!recipe) return;
    const ok = await confirmDialog(
      tRecipes("deleteRecipeConfirm", { title: recipe.title }),
      tCommon("delete"),
    );
    if (!ok) return;
    await deleteRecipeAction(recipe.id);
    router.push("/recipes");
    router.refresh();
  }

  async function handleRemove() {
    if (!recipe) return;
    const ok = await confirmDialog(
      tRecipes("removeRecipeConfirm", { title: recipe.title }),
      tCommon("remove"),
    );
    if (!ok) return;
    await removeRecipeAction(recipe.id);
    router.push("/recipes");
    router.refresh();
  }

  const openAddToList = useCallback(() => setAddOpen(true), []);

  const dockHandlers = useMemo(
    () =>
      editing
        ? {
            formActions: {
              visible: true,
              cancelLabel: tCommon("cancel"),
              saveLabel: formSaving
                ? tRecipes("saving")
                : tRecipes("saveChanges"),
              saving: formSaving,
              onCancel: () => setEditing(false),
              onSave: () => recipeFormRef.current?.submit(),
            },
            sortVisible: false,
            addVisible: false,
          }
        : {
            sortVisible: false,
            action: {
              visible: true,
              label: tAddToList("addToList"),
              onPress: openAddToList,
            },
            addVisible: false,
          },
    [editing, formSaving, openAddToList, tAddToList, tCommon, tRecipes],
  );

  useRegisterDock(dockHandlers);

  if (loading) {
    return <LoadingState label={tCommon("loading")} />;
  }

  if (notFound || !recipe) {
    return (
      <ProblemPage
        appName={tCommon("appName")}
        title={tErrors("pageNotFoundTitle")}
        description={tErrors("pageNotFoundDescription")}
        primaryLabel={tErrors("goHome")}
        primaryHref="/recipes"
      />
    );
  }

  if (editing && recipe.isOwner) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <header className="border-b border-[var(--border)] px-4 py-3">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            {tRecipes("editRecipe")}
          </h1>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-dock p-4">
          <RecipeForm
            ref={recipeFormRef}
            hideFixedFooter
            onSavingChange={setFormSaving}
            photoSlot={
              <RecipePhotoField
                recipeId={recipe.id}
                imageUrl={recipe.imageUrl}
                editable
                onPhotoUpdated={(result) =>
                  setRecipe((current) =>
                    current
                      ? {
                          ...current,
                          imagePath: result?.imagePath ?? null,
                          imageUrl: result?.imageUrl ?? null,
                        }
                      : current,
                  )
                }
              />
            }
            initial={{
              title: recipe.title,
              description: recipe.description,
              instructions: recipe.instructions,
              tags: recipe.tags,
              defaultServings: recipe.defaultServings,
              prepMinutes: recipe.prepMinutes,
              cookMinutes: recipe.cookMinutes,
              ingredients: recipe.ingredients.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
              })),
            }}
            submitLabel={tRecipes("saveChanges")}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="font-ui sticky top-0 z-10 bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-2 py-3">
          <BackLink href="/recipes" label={tCommon("back")} />
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-[var(--foreground)]">
            {recipe.title}
          </h1>
          <button
            type="button"
            aria-label={tShare("shareRecipe")}
            onClick={() => setShareOpen(true)}
            className="pressable flex size-10 items-center justify-center rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            <ShareIcon className="size-5" />
          </button>
        </div>
      </header>

      <RecipePhotoField
        recipeId={recipe.id}
        imageUrl={recipe.imageUrl}
        editable={recipe.isOwner}
        variant="hero"
        onPhotoUpdated={(result) =>
          setRecipe((current) =>
            current
              ? {
                  ...current,
                  imagePath: result?.imagePath ?? null,
                  imageUrl: result?.imageUrl ?? null,
                }
              : current,
          )
        }
      />

      <div className="flex-1 overflow-y-auto pb-dock">
        {joinedBanner ? (
          <div className="mx-4 mt-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
            {tRecipes("joinedBanner")}
          </div>
        ) : null}

        {!recipe.isOwner ? (
          <div className="mx-4 mt-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--muted-foreground)]">
            {tRecipes("viewOnlyBanner")}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 p-4">
          {recipe.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs text-[var(--foreground)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <RecipeTiming
            prepMinutes={recipe.prepMinutes}
            cookMinutes={recipe.cookMinutes}
          />

          {recipe.description ? (
            <section>
              <h2 className="font-ui mb-2 text-xs font-semibold tracking-wide text-[var(--label)] uppercase">
                {tRecipes("notes")}
              </h2>
              <div className="font-reading shadow-token-sm rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm whitespace-pre-wrap text-[var(--foreground)]">
                {recipe.description}
              </div>
            </section>
          ) : null}

          <ServingsScaler
            defaultServings={recipe.defaultServings}
            servings={servings}
            onChange={setServings}
            onReset={() => setServings(recipe.defaultServings)}
          />

          <section>
            <h2 className="font-ui mb-2 text-xs font-semibold tracking-wide text-[var(--label)] uppercase">
              {tRecipes("ingredients")}
            </h2>
            <ul className="font-reading shadow-token-sm divide-y divide-[var(--border)]/60 rounded-2xl bg-[var(--surface)]">
              {recipe.ingredients.map((item) => {
                const scaled = scaleQuantity(
                  item.quantity,
                  recipe.defaultServings,
                  servings,
                );
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="text-[var(--foreground)]">{item.name}</span>
                    <span className="text-[var(--muted-foreground)]">
                      {formatQty(scaled, item.unit) || "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {recipe.instructions ? (
            <section>
              <h2 className="font-ui mb-2 text-xs font-semibold tracking-wide text-[var(--label)] uppercase">
                {tRecipes("instructions")}
              </h2>
              <ol className="font-reading shadow-token-sm list-decimal space-y-2 rounded-2xl bg-[var(--surface)] px-4 py-3 pl-8 text-sm text-[var(--foreground)]">
                {recipe.instructions
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((step, index) => (
                    <li key={`${index}-${step}`}>{step}</li>
                  ))}
              </ol>
            </section>
          ) : null}

          <div className="font-ui flex flex-col gap-2 pt-2">
            {recipe.isOwner ? (
              <>
                <Button
                  variant="secondary"
                  fullWidth
                  type="button"
                  onClick={() => setEditing(true)}
                >
                  {tRecipes("edit")}
                </Button>
                <Button
                  variant="destructive"
                  fullWidth
                  type="button"
                  onClick={() => void handleDelete()}
                >
                  {tCommon("delete")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  fullWidth
                  type="button"
                  disabled={cloning}
                  onClick={() => void handleClone()}
                >
                  {cloning ? tRecipes("cloning") : tRecipes("cloneRecipe")}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  type="button"
                  onClick={() => void handleRemove()}
                >
                  {tCommon("remove")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {shareOpen ? (
        <ShareRecipeSheet
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      ) : null}

      {addOpen ? (
        <AddToListSheet
          recipeId={recipe.id}
          defaultServings={recipe.defaultServings}
          ingredients={recipe.ingredients}
          open={addOpen}
          onClose={() => setAddOpen(false)}
        />
      ) : null}
    </div>
  );
}
