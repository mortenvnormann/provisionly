import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  localeFromAcceptLanguage,
  resolveLocale,
} from "@/lib/i18n/locales";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    localeFromAcceptLanguage(headerStore.get("accept-language")),
    DEFAULT_LOCALE,
  );

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
