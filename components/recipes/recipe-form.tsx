"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RecipeInput } from "@/lib/recipes/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type IngredientDraft = {
  key: string;
  name: string;
  quantity: string;
  unit: string;
};

type RecipeFormProps = {
  initial?: RecipeInput;
  submitLabel: string;
  onSubmit: (input: RecipeInput) => Promise<void>;
  onCancel?: () => void;
};

function emptyIngredient(): IngredientDraft {
  return {
    key: crypto.randomUUID(),
    name: "",
    quantity: "",
    unit: "",
  };
}

function toInput(
  title: string,
  description: string,
  instructions: string,
  tagsText: string,
  defaultServings: number,
  ingredients: IngredientDraft[],
): RecipeInput {
  return {
    title,
    description,
    instructions,
    tags: tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    defaultServings,
    ingredients: ingredients
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity.trim()
          ? Number.parseFloat(item.quantity)
          : null,
        unit: item.unit.trim() || null,
      })),
  };
}

export function RecipeForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: RecipeFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [tagsText, setTagsText] = useState(initial?.tags.join(", ") ?? "");
  const [defaultServings, setDefaultServings] = useState(
    initial?.defaultServings ?? 4,
  );
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(() =>
    initial?.ingredients.length
      ? initial.ingredients.map((item) => ({
          key: crypto.randomUUID(),
          name: item.name,
          quantity: item.quantity != null ? String(item.quantity) : "",
          unit: item.unit ?? "",
        }))
      : [emptyIngredient()],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateIngredient(key: string, patch: Partial<IngredientDraft>) {
    setIngredients((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function removeIngredient(key: string) {
    setIngredients((prev) =>
      prev.length <= 1 ? prev : prev.filter((item) => item.key !== key),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const input = toInput(
        title,
        description,
        instructions,
        tagsText,
        defaultServings,
        ingredients,
      );
      if (input.ingredients.length === 0) {
        throw new Error("Add at least one ingredient.");
      }
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save recipe");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-24">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Recipe name"
        required
      />

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[var(--foreground)]">
          Default servings
        </span>
        <input
          type="number"
          min={1}
          value={defaultServings}
          onChange={(e) =>
            setDefaultServings(Math.max(1, Number.parseInt(e.target.value, 10) || 1))
          }
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[var(--foreground)]">Tags</span>
        <input
          type="text"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="quick, vegetarian"
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[var(--foreground)]">
          Description
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Notes, tips, or comments…"
          className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-[var(--foreground)]">
          Instructions
        </span>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={5}
          placeholder="Step by step…"
          className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base"
        />
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Ingredients
          </span>
          <button
            type="button"
            onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
            className="text-sm font-medium text-[var(--primary)]"
          >
            + Add
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {ingredients.map((item) => (
            <li
              key={item.key}
              className="grid grid-cols-[1fr_4.5rem_4.5rem_auto] gap-2"
            >
              <input
                type="text"
                value={item.name}
                onChange={(e) =>
                  updateIngredient(item.key, { name: e.target.value })
                }
                placeholder="Ingredient"
                className="h-10 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
              />
              <input
                type="text"
                inputMode="decimal"
                value={item.quantity}
                onChange={(e) =>
                  updateIngredient(item.key, { quantity: e.target.value })
                }
                placeholder="Qty"
                className="h-10 rounded-xl border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
              />
              <input
                type="text"
                value={item.unit}
                onChange={(e) =>
                  updateIngredient(item.key, { unit: e.target.value })
                }
                placeholder="Unit"
                className="h-10 rounded-xl border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeIngredient(item.key)}
                className="flex size-10 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                aria-label="Remove ingredient"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      {error ? (
        <p className="rounded-lg bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
          {error}
        </p>
      ) : null}

      <div className="safe-area-pb fixed inset-x-0 bottom-0 flex gap-2 border-t border-[var(--border)] bg-[var(--surface)] p-4">
        {onCancel ? (
          <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" fullWidth disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
