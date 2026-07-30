"use client";

import {
  formatRecipeMinutes,
  totalRecipeMinutes,
} from "@/lib/recipes/timing";
import { useTranslations } from "next-intl";

type RecipeTimingProps = {
  prepMinutes: number | null;
  cookMinutes: number | null;
};

export function RecipeTiming({ prepMinutes, cookMinutes }: RecipeTimingProps) {
  const tRecipes = useTranslations("recipes");
  const total = totalRecipeMinutes(prepMinutes, cookMinutes);

  if (total == null) return null;

  const formatMinutes = (count: number) =>
    tRecipes("minutesShort", { count });
  const formatHoursMinutes = (hours: number, minutes: number) =>
    tRecipes("hoursMinutesShort", { hours, minutes });

  return (
    <div className="card-surface-bordered px-3 py-2.5">
      <p className="font-ui text-sm font-medium text-[var(--foreground)]">
        {tRecipes("timing")}
      </p>
      <dl className="mt-2 space-y-1 text-sm">
        {prepMinutes != null ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[var(--muted-foreground)]">
              {tRecipes("prepTime")}
            </dt>
            <dd className="font-medium text-[var(--foreground)]">
              {formatRecipeMinutes(prepMinutes, {
                formatMinutes,
                formatHoursMinutes,
              })}
            </dd>
          </div>
        ) : null}
        {cookMinutes != null ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[var(--muted-foreground)]">
              {tRecipes("cookTime")}
            </dt>
            <dd className="font-medium text-[var(--foreground)]">
              {formatRecipeMinutes(cookMinutes, {
                formatMinutes,
                formatHoursMinutes,
              })}
            </dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)]/60 pt-2">
          <dt className="font-medium text-[var(--foreground)]">
            {tRecipes("totalTime")}
          </dt>
          <dd className="font-semibold text-[var(--foreground)]">
            {formatRecipeMinutes(total, {
              formatMinutes,
              formatHoursMinutes,
            })}
          </dd>
        </div>
      </dl>
    </div>
  );
}
