"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addRecipeToListAction, fetchListsForRecipeAction } from "@/lib/recipes/actions";
import { scaleQuantity } from "@/lib/recipes/scale";
import type { RecipeIngredientRow } from "@/lib/recipes/types";
import type { ListSummary } from "@/lib/lists/types";
import { ServingsScaler } from "@/components/recipes/servings-scaler";
import { Button } from "@/components/ui/button";

type AddToListSheetProps = {
  recipeId: string;
  defaultServings: number;
  ingredients: RecipeIngredientRow[];
  open: boolean;
  onClose: () => void;
};

function formatQty(qty: number | null, unit: string | null): string {
  if (qty == null) return unit ? unit : "";
  return unit ? `${qty} ${unit}` : String(qty);
}

export function AddToListSheet({
  recipeId,
  defaultServings,
  ingredients,
  open,
  onClose,
}: AddToListSheetProps) {
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [listId, setListId] = useState("");
  const [servings, setServings] = useState(defaultServings);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setResult(null);
      setError(null);
      setServings(defaultServings);
      setSelected(new Set(ingredients.map((i) => i.id)));
      return;
    }

    setSelected(new Set(ingredients.map((i) => i.id)));
    setServings(defaultServings);
    setLoading(true);

    void fetchListsForRecipeAction()
      .then((data) => {
        setLists(data);
        if (data[0]) setListId(data[0].id);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load lists");
      })
      .finally(() => setLoading(false));
  }, [open, defaultServings, ingredients]);

  function toggleIngredient(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!listId || selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const { added, merged } = await addRecipeToListAction(recipeId, listId, {
        targetServings: servings,
        selectedIngredientIds: [...selected],
      });
      const parts: string[] = [];
      if (added) parts.push(`${added} added`);
      if (merged) parts.push(`${merged} merged`);
      setResult(parts.join(", ") || "Done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add to list");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
        <div className="border-b border-[var(--border)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Add to list
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Choose a list and deselect anything you already have.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {loading ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading lists…</p>
          ) : lists.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              No lists yet.{" "}
              <Link href="/home" className="text-[var(--brand)] underline-offset-2 hover:underline">
                Create one first
              </Link>
              .
            </p>
          ) : (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase">
                  Target list
                </span>
                <select
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-base"
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title}
                    </option>
                  ))}
                </select>
              </label>

              <ServingsScaler
                defaultServings={defaultServings}
                servings={servings}
                onChange={setServings}
              />

              <ul className="divide-y divide-[var(--border)]/60 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                {ingredients.map((item) => {
                  const scaled = scaleQuantity(
                    item.quantity,
                    defaultServings,
                    servings,
                  );
                  return (
                    <li key={item.id}>
                      <label className="flex items-center gap-3 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleIngredient(item.id)}
                          className="size-4 rounded border-[var(--border)]"
                        />
                        <span className="min-w-0 flex-1 text-sm text-[var(--foreground)]">
                          {item.name}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {formatQty(scaled, item.unit)}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {error ? (
            <p className="rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
              {error}
            </p>
          ) : null}

          {result ? (
            <p className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--foreground)]">
              {result}.{" "}
              <Link
                href={`/lists/${listId}`}
                className="font-medium text-[var(--brand)] underline-offset-2 hover:underline"
              >
                Open list
              </Link>
            </p>
          ) : null}
        </div>

        <div className="border-t border-[var(--border)] p-4">
          <Button
            fullWidth
            disabled={submitting || !listId || selected.size === 0 || !!result}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Adding…" : "Add to list"}
          </Button>
        </div>
      </div>
    </div>
  );
}
