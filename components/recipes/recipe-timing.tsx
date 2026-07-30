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

  const format = (minutes: number) =>
    formatRecipeMinutes(minutes, { formatMinutes, formatHoursMinutes });

  const parts: string[] = [];
  if (prepMinutes != null) {
    parts.push(`${tRecipes("prepTime")} ${format(prepMinutes)}`);
  }
  if (cookMinutes != null) {
    parts.push(`${tRecipes("cookTime")} ${format(cookMinutes)}`);
  }
  parts.push(`${tRecipes("totalTime")} ${format(total)}`);

  return (
    <p className="font-ui text-sm text-[var(--muted-foreground)]">
      {parts.join(" · ")}
    </p>
  );
}
