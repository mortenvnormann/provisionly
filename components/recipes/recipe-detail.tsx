"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ServingsScaler } from "@/components/recipes/servings-scaler";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  cloneRecipeAction,
  deleteRecipeAction,
  removeRecipeAction,
  updateRecipeAction,
} from "@/lib/recipes/actions";
import { scaleQuantity } from "@/lib/recipes/scale";
import { useRecipeSync } from "@/lib/recipes/use-recipe-sync";
import type { RecipeDetail, RecipeInput } from "@/lib/recipes/types";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
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
  recipe: RecipeDetail;
  showJoinedBanner?: boolean;
};

function formatQty(qty: number | null, unit: string | null): string {
  if (qty == null) return unit ?? "";
  return unit ? `${qty} ${unit}` : String(qty);
}

export function RecipeDetailView({
  recipe: initialRecipe,
  showJoinedBanner = false,
}: RecipeDetailViewProps) {
  const tRecipes = useTranslations("recipes");
  const tCommon = useTranslations("common");
  const tShare = useTranslations("share");
  const tAddToList = useTranslations("addToList");
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [recipe, setRecipe] = useState(initialRecipe);
  const [servings, setServings] = useState(initialRecipe.defaultServings);
  const [editing, setEditing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [joinedBanner, setJoinedBanner] = useState(showJoinedBanner);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    setRecipe(initialRecipe);
    setServings(initialRecipe.defaultServings);
  }, [initialRecipe]);

  useEffect(() => {
    if (!showJoinedBanner) return;
    const timer = setTimeout(() => setJoinedBanner(false), 5000);
    return () => clearTimeout(timer);
  }, [showJoinedBanner]);

  useRecipeSync({
    recipeId: recipe.id,
    enabled: true,
    onRecipeChange: (nextRecipe) => {
      setRecipe(nextRecipe);
      setServings(nextRecipe.defaultServings);
    },
  });

  async function handleUpdate(input: RecipeInput) {
    await updateRecipeAction(recipe.id, input);
    setEditing(false);
    router.refresh();
  }

  async function handleClone() {
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
    const ok = await confirmDialog(
      tRecipes("removeRecipeConfirm", { title: recipe.title }),
      tCommon("remove"),
    );
    if (!ok) return;
    await removeRecipeAction(recipe.id);
    router.push("/recipes");
    router.refresh();
  }

  if (editing && recipe.isOwner) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <header className="border-b border-[var(--border)] px-4 py-3">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            {tRecipes("editRecipe")}
          </h1>
        </header>
        <div className="p-4">
          <RecipeForm
            initial={{
              title: recipe.title,
              description: recipe.description,
              instructions: recipe.instructions,
              tags: recipe.tags,
              defaultServings: recipe.defaultServings,
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
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-2 py-3">
          <BackLink href="/recipes" label={tCommon("back")} />
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-[var(--foreground)]">
            {recipe.title}
          </h1>
          <Button variant="ghost" type="button" onClick={() => setShareOpen(true)}>
            {tShare("shareRecipe")}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-28">
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

          {recipe.description ? (
            <section>
              <h2 className="mb-2 text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
                {tRecipes("notes")}
              </h2>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm whitespace-pre-wrap text-[var(--foreground)]">
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
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
              {tRecipes("ingredients")}
            </h2>
            <ul className="divide-y divide-[var(--border)]/60 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
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
              <h2 className="mb-2 text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
                {tRecipes("instructions")}
              </h2>
              <ol className="list-decimal space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pl-8 text-sm text-[var(--foreground)]">
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
        </div>
      </div>

      <div className="safe-area-pb fixed inset-x-0 bottom-0 flex flex-col gap-2 border-t border-[var(--border)] bg-[var(--surface)] p-4">
        <Button fullWidth onClick={() => setAddOpen(true)}>
          {tAddToList("addToList")}
        </Button>
        <div className="flex gap-2">
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
