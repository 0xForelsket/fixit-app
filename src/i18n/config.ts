// i18n configuration for FixIt CMMS
// Supports: English, German, Chinese, Hungarian (4 sites)

export const locales = ["en", "de", "zh", "hu"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  zh: "中文",
  hu: "Magyar",
};

// Native names for display in language selector
export const localeNativeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  zh: "简体中文",
  hu: "Magyar",
};

// Cookie name for storing user's language preference
export const LOCALE_COOKIE_NAME = "fixit-locale";
