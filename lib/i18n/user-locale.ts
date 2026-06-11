import "server-only";

import { getLocale } from "next-intl/server";
import { getLocaleCookie } from "@/lib/i18n/cookie";
import {
  DEFAULT_LOCALE,
  resolveLocale,
  type AppLocale,
} from "@/lib/i18n/locales";
import { createServiceClient } from "@/lib/supabase/service";

export async function getLocaleForUser(userId: string): Promise<AppLocale> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select("locale")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return resolveLocale(data?.locale, DEFAULT_LOCALE);
}

export async function getRequestLocale(userId?: string | null): Promise<AppLocale> {
  if (userId) {
    try {
      return await getLocaleForUser(userId);
    } catch {
      // fall through to cookie/request locale
    }
  }

  try {
    return resolveLocale(await getLocale(), await getLocaleCookie());
  } catch {
    return await getLocaleCookie();
  }
}
