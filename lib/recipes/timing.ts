export function totalRecipeMinutes(
  prep: number | null,
  cook: number | null,
): number | null {
  const p = prep ?? 0;
  const c = cook ?? 0;
  const total = p + c;
  return total > 0 ? total : null;
}

type FormatRecipeMinutesOptions = {
  formatMinutes?: (count: number) => string;
  formatHoursMinutes?: (hours: number, minutes: number) => string;
};

export function formatRecipeMinutes(
  minutes: number,
  options?: FormatRecipeMinutesOptions,
): string {
  const formatMin = options?.formatMinutes ?? ((count) => `${count} min`);
  const formatHM =
    options?.formatHoursMinutes ??
    ((hours, mins) => (mins > 0 ? `${hours} h ${mins} min` : `${hours} h`));

  if (minutes < 60) {
    return formatMin(minutes);
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return formatHM(hours, mins);
}

export function parseRecipeMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed;
}
