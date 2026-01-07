import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE_NAME,
  type Locale,
  defaultLocale,
  locales,
} from "./config";

export default getRequestConfig(async () => {
  // 1. Check cookie first (user preference)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value as
    | Locale
    | undefined;

  if (localeCookie && locales.includes(localeCookie)) {
    return {
      locale: localeCookie,
      messages: (await import(`../messages/${localeCookie}.json`)).default,
    };
  }

  // 2. Check Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");

  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "de-DE,de;q=0.9,en;q=0.8")
    const preferredLocales = acceptLanguage
      .split(",")
      .map((lang) => {
        const [locale] = lang.trim().split(";");
        // Handle full locale codes like "de-DE" -> "de"
        return locale.split("-")[0].toLowerCase();
      })
      .filter((lang): lang is Locale => locales.includes(lang as Locale));

    if (preferredLocales.length > 0) {
      const locale = preferredLocales[0];
      return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
      };
    }
  }

  // 3. Fall back to default locale
  return {
    locale: defaultLocale,
    messages: (await import(`../messages/${defaultLocale}.json`)).default,
  };
});
