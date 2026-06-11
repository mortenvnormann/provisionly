"use client";
import { useTranslations } from "next-intl";

type ServingsScalerProps = {
  defaultServings: number;
  servings: number;
  onChange: (servings: number) => void;
  onReset?: () => void;
  disabled?: boolean;
};

export function ServingsScaler({
  defaultServings,
  servings,
  onChange,
  onReset,
  disabled = false,
}: ServingsScalerProps) {
  const tCommon = useTranslations("common");
  const tRecipes = useTranslations("recipes");
  const canReset = servings !== defaultServings;

  function adjust(delta: number) {
    onChange(Math.max(1, servings + delta));
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            {tCommon("servings")}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {tRecipes("recipeDefaultServings", { count: defaultServings })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={disabled || servings <= 1}
            onClick={() => adjust(-1)}
            className="flex size-9 items-center justify-center rounded-lg border border-[var(--border)] text-lg disabled:opacity-40"
            aria-label={tRecipes("fewerServings")}
          >
            −
          </button>
          <span className="min-w-8 text-center text-lg font-semibold text-[var(--foreground)]">
            {servings}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => adjust(1)}
            className="flex size-9 items-center justify-center rounded-lg border border-[var(--border)] text-lg disabled:opacity-40"
            aria-label={tRecipes("moreServings")}
          >
            +
          </button>
        </div>
      </div>
      {canReset && onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-3 text-sm font-medium text-[var(--brand)]"
        >
          {tRecipes("resetServings", { count: defaultServings })}
        </button>
      ) : null}
    </div>
  );
}
