"use client";

import { useRef, useState } from "react";
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

type InstructionStepDraft = {
  key: string;
  text: string;
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

function emptyStep(): InstructionStepDraft {
  return {
    key: crypto.randomUUID(),
    text: "",
  };
}

function parseInstructionSteps(instructions: string): InstructionStepDraft[] {
  const lines = instructions
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length > 0
    ? lines.map((text) => ({ key: crypto.randomUUID(), text }))
    : [emptyStep()];
}

function serializeInstructions(steps: InstructionStepDraft[]): string {
  return steps
    .map((step) => step.text.trim())
    .filter(Boolean)
    .join("\n");
}

function toInput(
  title: string,
  description: string,
  steps: InstructionStepDraft[],
  tagsText: string,
  defaultServings: number,
  ingredients: IngredientDraft[],
): RecipeInput {
  return {
    title,
    description,
    instructions: serializeInstructions(steps),
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
  const ingredientRefs = useRef(new Map<string, HTMLInputElement>());
  const stepRefs = useRef(new Map<string, HTMLInputElement>());

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [steps, setSteps] = useState<InstructionStepDraft[]>(() =>
    parseInstructionSteps(initial?.instructions ?? ""),
  );
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

  function focusIngredient(key: string) {
    requestAnimationFrame(() => {
      ingredientRefs.current.get(key)?.focus();
    });
  }

  function focusStep(key: string) {
    requestAnimationFrame(() => {
      stepRefs.current.get(key)?.focus();
    });
  }

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

  function addIngredientAfter(key: string) {
    const next = emptyIngredient();
    setIngredients((prev) => {
      const index = prev.findIndex((item) => item.key === key);
      if (index === -1) return [...prev, next];
      const copy = [...prev];
      copy.splice(index + 1, 0, next);
      return copy;
    });
    focusIngredient(next.key);
  }

  function handleIngredientKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    key: string,
    name: string,
  ) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!name.trim()) return;

    const index = ingredients.findIndex((item) => item.key === key);
    const isLast = index === ingredients.length - 1;

    if (isLast) {
      addIngredientAfter(key);
      return;
    }

    const nextKey = ingredients[index + 1]?.key;
    if (nextKey) focusIngredient(nextKey);
  }

  function updateStep(key: string, text: string) {
    setSteps((prev) =>
      prev.map((step) => (step.key === key ? { ...step, text } : step)),
    );
  }

  function removeStep(key: string) {
    setSteps((prev) =>
      prev.length <= 1 ? prev : prev.filter((step) => step.key !== key),
    );
  }

  function addStepAfter(key: string) {
    const next = emptyStep();
    setSteps((prev) => {
      const index = prev.findIndex((step) => step.key === key);
      if (index === -1) return [...prev, next];
      const copy = [...prev];
      copy.splice(index + 1, 0, next);
      return copy;
    });
    focusStep(next.key);
  }

  function handleStepKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    key: string,
    text: string,
  ) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!text.trim()) return;
    addStepAfter(key);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const input = toInput(
        title,
        description,
        steps,
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

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Instructions
          </span>
          <button
            type="button"
            onClick={() => {
              const next = emptyStep();
              setSteps((prev) => [...prev, next]);
              focusStep(next.key);
            }}
            className="text-sm font-medium text-[var(--accent)]"
          >
            + Add step
          </button>
        </div>
        <p className="mb-2 text-xs text-[var(--muted-foreground)]">
          Press Enter after each step to add the next one.
        </p>
        <ol className="flex list-none flex-col gap-2">
          {steps.map((step, index) => (
            <li key={step.key} className="flex items-start gap-2">
              <span className="mt-2.5 w-6 shrink-0 text-sm font-semibold text-[var(--muted-foreground)]">
                {index + 1}.
              </span>
              <input
                ref={(node) => {
                  if (node) stepRefs.current.set(step.key, node);
                  else stepRefs.current.delete(step.key);
                }}
                type="text"
                value={step.text}
                onChange={(e) => updateStep(step.key, e.target.value)}
                onKeyDown={(e) => handleStepKeyDown(e, step.key, step.text)}
                placeholder={`Step ${index + 1}`}
                enterKeyHint="next"
                className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => removeStep(step.key)}
                className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                aria-label={`Remove step ${index + 1}`}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Ingredients
          </span>
          <button
            type="button"
            onClick={() => {
              const next = emptyIngredient();
              setIngredients((prev) => [...prev, next]);
              focusIngredient(next.key);
            }}
            className="text-sm font-medium text-[var(--accent)]"
          >
            + Add
          </button>
        </div>
        <p className="mb-2 text-xs text-[var(--muted-foreground)]">
          Press Enter after each ingredient to add the next one.
        </p>
        <ul className="flex flex-col gap-2">
          {ingredients.map((item) => (
            <li
              key={item.key}
              className="grid grid-cols-[1fr_4.5rem_4.5rem_auto] gap-2"
            >
              <input
                ref={(node) => {
                  if (node) ingredientRefs.current.set(item.key, node);
                  else ingredientRefs.current.delete(item.key);
                }}
                type="text"
                value={item.name}
                onChange={(e) =>
                  updateIngredient(item.key, { name: e.target.value })
                }
                onKeyDown={(e) =>
                  handleIngredientKeyDown(e, item.key, item.name)
                }
                placeholder="Ingredient"
                enterKeyHint="next"
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
