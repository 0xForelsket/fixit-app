"use server";

import { LOCALE_COOKIE_NAME, type Locale, locales } from "@/i18n/config";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setLocale(locale: Locale) {
  // Validate locale
  if (!locales.includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  const cookieStore = await cookies();
  
  // Set cookie with 1 year expiry
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
    sameSite: "lax",
  });

  // Revalidate all paths to refresh with new locale
  revalidatePath("/", "layout");
}

export async function getLocaleFromCookie(): Promise<Locale | null> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined;
  
  if (locale && locales.includes(locale)) {
    return locale;
  }
  
  return null;
}
