export const SUPPORTED_LOCALES = [
  "en",
  "de",
  "fr",
  "nl",
  "da",
  "sv",
  "no",
  "fi",
] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  nl: "Nederlands",
  da: "Dansk",
  sv: "Svenska",
  no: "Norsk",
  fi: "Suomi",
};

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(
  ...candidates: (string | null | undefined)[]
): AppLocale {
  for (const candidate of candidates) {
    if (candidate && isAppLocale(candidate)) {
      return candidate;
    }
  }
  return DEFAULT_LOCALE;
}

export function localeFromAcceptLanguage(header: string | null): AppLocale {
  if (!header) return DEFAULT_LOCALE;

  const parts = header.split(",").map((part) => part.trim().split(";")[0]);
  for (const part of parts) {
    const base = part.split("-")[0]?.toLowerCase();
    if (base && isAppLocale(base)) return base;
  }

  return DEFAULT_LOCALE;
}
